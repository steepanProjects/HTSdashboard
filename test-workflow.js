// Test script to verify the hackathon monitor workflow
// Run with: node test-workflow.js

const testWorkflow = async () => {
  console.log('🧪 Testing Hackathon Monitor Workflow\n');

  // Step 1: Check if server is running
  console.log('1️⃣ Checking server status...');
  try {
    const statusRes = await fetch('http://localhost:3000/api/status');
    const status = await statusRes.json();
    console.log('✅ Server is running');
    console.log('   Queue status:', status);
  } catch (error) {
    console.log('❌ Server is not running. Start with: npm run dev');
    return;
  }

  // Step 2: Get teams and members
  console.log('\n2️⃣ Fetching teams and members...');
  const teamsRes = await fetch('http://localhost:3000/api/admin/teams');
  const teams = await teamsRes.json();
  
  if (!Array.isArray(teams) || teams.length === 0) {
    console.log('❌ No teams found. Create a team first at /admin');
    return;
  }
  
  const team = teams[0];
  console.log(`✅ Found team: ${team.name} (${team.id})`);
  
  if (!team.members || team.members.length === 0) {
    console.log('❌ No members found. Create a member first at /admin');
    return;
  }
  
  const member = team.members[0];
  console.log(`✅ Found member: ${member.name} (${member.id})`);

  // Step 3: Send test screenshots
  console.log('\n3️⃣ Sending test screenshots...');
  console.log('   This will simulate 6 screenshots over 3 minutes');
  console.log('   (In production, Electron app sends every 30 seconds)\n');

  for (let i = 1; i <= 6; i++) {
    const timestamp = new Date(Date.now() + i * 30000).toISOString();
    
    // Create a simple test image (1x1 pixel PNG in base64)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const payload = {
      userId: member.id,
      teamId: team.id,
      timestamp: timestamp,
      image: testImage,
      countCycle: i,
    };

    try {
      const res = await fetch('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      console.log(`   Screenshot ${i}/6: ${result.success ? '✅' : '❌'} ${result.message}`);
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   Screenshot ${i}/6: ❌ Error - ${error.message}`);
    }
  }

  // Step 4: Check results
  console.log('\n4️⃣ Checking results...');
  console.log('   Waiting for processing to complete...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check individual analyses
  const analysesRes = await fetch(`http://localhost:3000/api/monitor/analyses?teamId=${team.id}`);
  const analyses = await analysesRes.json();
  console.log(`✅ Individual analyses saved: ${analyses.length}`);

  // Check batch summary
  const progressRes = await fetch('http://localhost:3000/api/monitor/progress');
  const progress = await progressRes.json();
  const teamProgress = progress[team.id] || [];
  console.log(`✅ Batch summaries created: ${teamProgress.length}`);

  if (teamProgress.length > 0) {
    const latest = teamProgress[0];
    console.log('\n📊 Latest Batch Summary:');
    console.log(`   GPT Score: ${latest.gptScore}`);
    console.log(`   Llama Score: ${latest.llamaScore}`);
    console.log(`   Mean Score: ${latest.meanScore}`);
    console.log(`   AI Dependency: ${latest.aiDependencyDetected ? 'Yes' : 'No'}`);
  }

  console.log('\n✅ Workflow test complete!');
  console.log('   View results at: http://localhost:3000/monitor');
};

testWorkflow().catch(console.error);

// Test script to verify the backend API
const testBackend = async () => {
  try {
    console.log('Testing backend API...');
    
    // Test 1: Simple greeting
    const response1 = await fetch('http://localhost:3000/api/parse-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Hello' }),
    });
    
    console.log('Response 1 Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response 1 Data:', data1);
    
    // Test 2: Task creation request
    const response2 = await fetch('http://localhost:3000/api/parse-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Create a task named Study DBMS due tomorrow' }),
    });
    
    console.log('Response 2 Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response 2 Data:', data2);
    
    // Test 3: Test Gemini API directly
    const response3 = await fetch('http://localhost:3000/api/test-gemini');
    console.log('Response 3 Status:', response3.status);
    const data3 = await response3.json();
    console.log('Response 3 Data:', data3);
  } catch (error) {
    console.error('Error testing backend:', error);
  }
};

testBackend();
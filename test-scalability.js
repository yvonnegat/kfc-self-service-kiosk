// test-scalability.js
const BASE_URL = 'http://localhost:3000/api';

// Test concurrent orders
async function testConcurrentOrders() {
  console.log('🚀 Testing concurrent order processing...\n');

  const orders = [
    {
      items: [
        { menu_item_id: 1, quantity: 2, unit_price: 850.00, customizations: [] },
        { menu_item_id: 10, quantity: 1, unit_price: 250.00, customizations: [] },
      ],
      payment_method: 'card',
      total_amount: 1950.00,
    },
    {
      items: [
        { menu_item_id: 6, quantity: 1, unit_price: 650.00, customizations: [] },
        { menu_item_id: 14, quantity: 1, unit_price: 150.00, customizations: [] },
      ],
      payment_method: 'mobile_money',
      total_amount: 800.00,
    },
    {
      items: [
        { menu_item_id: 2, quantity: 1, unit_price: 1200.00, customizations: [] },
      ],
      payment_method: 'card',
      total_amount: 1200.00,
    },
    {
      items: [
        { menu_item_id: 8, quantity: 2, unit_price: 850.00, customizations: [] },
        { menu_item_id: 11, quantity: 2, unit_price: 350.00, customizations: [] },
      ],
      payment_method: 'card',
      total_amount: 2400.00,
    },
    {
      items: [
        { menu_item_id: 4, quantity: 1, unit_price: 2500.00, customizations: [] },
      ],
      payment_method: 'mobile_money',
      total_amount: 2500.00,
    },
  ];

  const startTime = Date.now();

  // Send all orders simultaneously
  const promises = orders.map((order, index) => 
    fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => ({ 
      orderNum: index + 1, 
      success: data.success, 
      orderNumber: data.data?.order_number,
      error: data.error 
    }))
    .catch(error => ({ 
      orderNum: index + 1, 
      success: false, 
      error: error.message 
    }))
  );

  const results = await Promise.all(promises);
  const endTime = Date.now();

  console.log('📊 Results:\n');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Order ${result.orderNum}: ${result.success ? result.orderNumber : result.error}`);
  });

  const successCount = results.filter(r => r.success).length;
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n⏱️  Time taken: ${duration} seconds`);
  console.log(`✅ Successful: ${successCount}/${orders.length}`);
  console.log(`❌ Failed: ${orders.length - successCount}/${orders.length}`);
}

// Test menu loading
async function testMenuLoading() {
  console.log('\n📋 Testing menu loading...\n');

  const startTime = Date.now();
  const response = await fetch(`${BASE_URL}/menu`);
  const data = await response.json();
  const endTime = Date.now();

  if (data.success) {
    console.log(`✅ Menu loaded: ${data.data.length} items`);
    console.log(`⏱️  Load time: ${endTime - startTime}ms`);
  } else {
    console.log(`❌ Menu load failed: ${data.error}`);
  }
}

// Run all tests
async function runTests() {
  console.log('=================================');
  console.log('  KFC KIOSK SCALABILITY TEST');
  console.log('=================================\n');

  try {
    await testMenuLoading();
    await testConcurrentOrders();
    
    console.log('\n=================================');
    console.log('  ALL TESTS COMPLETED');
    console.log('=================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();

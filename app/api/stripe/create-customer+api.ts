export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // In a real implementation, you would use the Stripe SDK here
    // For now, we'll return a mock response
    const mockCustomer = {
      id: `cus_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      created: Math.floor(Date.now() / 1000),
    };

    return new Response(
      JSON.stringify(mockCustomer),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
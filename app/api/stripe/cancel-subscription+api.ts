export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'Subscription ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // In a real implementation, you would use the Stripe SDK here
    // For now, we'll return a mock response
    const mockCancelledSubscription = {
      id: subscriptionId,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
    };

    return new Response(
      JSON.stringify(mockCancelledSubscription),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getPollWithResults } from '@/lib/services/polls';
import type { PollWithVotes } from '@/lib/services/polls';

export default async function PollResultsPage({ 
  params 
}: { 
  params: { pollId: string } 
}) {
  let poll: PollWithVotes | null = null;
  
  try {
    poll = await getPollWithResults(params.pollId);
    
    if (!poll) {
      notFound();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        redirect(`/auth/login?redirectedFrom=/results/${params.pollId}`);
      } else if (error.message.includes('Forbidden')) {
        redirect('/unauthorized');
      } else if (error.message.includes('not found')) {
        notFound();
      }
    }
    console.error('Error fetching poll results:', error);
    throw error;
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Poll Results</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(poll.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/my-polls">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Polls
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results: {poll.title || 'Untitled Poll'}</CardTitle>
            {poll.description && <p className="text-muted-foreground">{poll.description}</p>}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {poll.options.map((option) => {
                const voteCount = typeof option.votes === 'number' 
                  ? option.votes 
                  : (option as any).votes?.[0]?.count || 0;
                const percentage = poll && poll.total_votes > 0 
                  ? (voteCount / poll.total_votes) * 100 
                  : 0;
                
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{option.text}</span>
                      <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {poll && poll.total_votes > 0 
                        ? `${Math.round(percentage)}%` 
                        : '0%'}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-lg font-medium">Total Votes: {poll?.total_votes || 0}</p>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Link href={`/polls/${poll.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Poll
                </Button>
              </Link>
              <Link href="/my-polls">
                <Button variant="outline">
                  View My Polls
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

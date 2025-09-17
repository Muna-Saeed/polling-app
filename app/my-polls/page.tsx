import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserPolls } from '@/lib/services/polls';
import type { PollWithVotes } from '@/lib/services/polls';

export default async function MyPollsPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login?message=You must be logged in to view this page');
  }

  const polls = await getUserPolls(user.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Link href="/create-poll" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          Create New Poll
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {polls && polls.length > 0 ? (
          <div className="space-y-4">
            {polls.map((poll: PollWithVotes) => (
              <div key={poll.id} className="border p-4 rounded-lg">
                <h2 className="text-xl font-semibold">{poll.title || 'Untitled Poll'}</h2>
                <p className="text-gray-600">{poll.total_votes} votes</p>
                {poll.description && <p className="text-gray-700 mt-1">{poll.description}</p>}
                <div className="mt-2 flex gap-2">
                  <Link 
                    href={`/polls/${poll.id}`} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Poll
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link 
                    href={`/polls/${poll.id}/results`} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 p-6 rounded-md text-center">
            <p className="text-gray-500">You haven't created any polls yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

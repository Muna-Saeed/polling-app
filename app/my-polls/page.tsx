import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getPollsForUser } from '@/utils/polls';
import { redirect } from 'next/navigation';

export default async function MyPollsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const polls = await getPollsForUser(supabase, user.id);

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
          <ul className="space-y-4">
            {polls.map((poll) => (
              <li key={poll.id} className="border border-gray-200 p-4 rounded-md flex justify-between items-center">
                <Link href={`/polls/${poll.id}`} className="text-blue-500 hover:underline">
                  {poll.question}
                </Link>
                <span className="text-sm text-gray-500">
                  {new Date(poll.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-gray-300 p-6 rounded-md text-center">
            <p className="text-gray-500">You haven't created any polls yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import VotingForm from '@/components/VotingForm';

// Mock data for a poll
const mockPolls = {
  '1': {
    id: '1',
    title: 'Favorite Programming Language',
    description: 'What programming language do you prefer to work with?',
    options: [
      { id: 'opt1', text: 'JavaScript' },
      { id: 'opt2', text: 'Python' },
      { id: 'opt3', text: 'TypeScript' },
      { id: 'opt4', text: 'Rust' },
      { id: 'opt5', text: 'Go' },
    ],
    createdAt: '2023-09-01T12:00:00Z',
    createdBy: 'user123',
  },
  '2': {
    id: '2',
    title: 'Best Frontend Framework',
    description: 'Which frontend framework do you think is the best?',
    options: [
      { id: 'opt1', text: 'React' },
      { id: 'opt2', text: 'Vue' },
      { id: 'opt3', text: 'Angular' },
      { id: 'opt4', text: 'Svelte' },
    ],
    createdAt: '2023-09-02T14:30:00Z',
    createdBy: 'user456',
  },
};

type PollDetailPageProps = {
  params: {
    id: string;
  };
};

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = params;
  const poll = mockPolls[id];

  // If poll doesn't exist, return 404
  if (!poll) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Poll Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
          <p className="text-gray-600 mb-4">
            Created on {new Date(poll.createdAt).toLocaleDateString()}
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-lg">{poll.description}</p>
          </div>
        </div>

        {/* Poll Content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Client Component for Voting */}
          <VotingForm pollId={poll.id} options={poll.options} />
        </div>

        {/* Poll Stats (placeholder) */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Poll Statistics</h2>
          <p className="text-gray-600">
            This is a placeholder for poll statistics that would show vote counts and percentages.
          </p>
        </div>
      </div>
    </div>
  );
}
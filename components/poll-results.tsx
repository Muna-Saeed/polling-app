'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export type PollResult = {
  id: string;
  question: string;
  created_at: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  total_votes: number;
  user_id: string;
};

interface PollResultsProps {
  poll: PollResult;
}

export function PollResults({ poll }: PollResultsProps) {
  // Prepare chart data
  const chartData = {
    labels: poll.options.map(opt => opt.text),
    datasets: [
      {
        label: 'Votes',
        data: poll.options.map(opt => opt.votes),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const total = poll.total_votes;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${value} vote${value !== 1 ? 's' : ''} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link href="/my-polls">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Polls
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            Created on {format(new Date(poll.created_at), 'MMM d, yyyy')}
          </div>
        </div>
        <CardTitle className="text-2xl">{poll.question}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {poll.total_votes} total vote{poll.total_votes !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 mt-4">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium">Vote Summary</h3>
          <div className="space-y-2">
            {poll.options.map((option) => {
              const percentage = poll.total_votes > 0 
                ? Math.round((option.votes / poll.total_votes) * 100) 
                : 0;
              
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-muted-foreground">
                      {option.votes} vote{option.votes !== 1 ? 's' : ''} • {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PollForm from './PollForm';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

describe('PollForm', () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (global.fetch as any).mockReset();
  });

  it('renders the form correctly', () => {
    render(<PollForm />);
    expect(screen.getByLabelText(/poll title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/poll question/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<PollForm />);
    
    await user.click(screen.getByText('Create Poll'));
    
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/poll question must be at least 10 characters long/i)).toBeInTheDocument();
    });
  });

  it('validates empty options', async () => {
    const user = userEvent.setup();
    render(<PollForm />);
    
    // Fill in title, description, and question but leave options empty
    await user.type(screen.getByLabelText(/poll title/i), 'Test Poll');
    await user.type(screen.getByLabelText(/description/i), 'This is a test poll description');
    await user.type(screen.getByLabelText(/poll question/i), 'What is your favorite programming language?');
    
    // Submit the form
    await user.click(screen.getByText('Create Poll'));
    
    // Check for validation error message for empty options
    await waitFor(() => {
      expect(screen.getByText(/option cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('successfully submits the form with valid data', async () => {
    const user = userEvent.setup();
    const mockPollData = { id: '123' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPollData),
    });
    
    render(<PollForm />);
    
    await user.type(screen.getByLabelText(/poll title/i), 'Test Poll');
    await user.type(screen.getByLabelText(/description/i), 'This is a test poll description');
    await user.type(screen.getByLabelText(/poll question/i), 'What is your favorite programming language?');
    
    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], 'JavaScript');
    await user.type(optionInputs[1], 'TypeScript');
    
    await user.click(screen.getByText('Create Poll'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Poll',
          description: 'This is a test poll description',
          question: 'What is your favorite programming language?',
          options: ['JavaScript', 'TypeScript'],
        }),
      });
    });
    
    expect(mockRouter.push).toHaveBeenCalledWith(`/polls/${mockPollData.id}`);
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('validates the return type matches expected poll schema', async () => {
    const user = userEvent.setup();
    const mockPollData = { 
      id: '123',
      title: 'Test Poll',
      description: 'This is a test poll description',
      question: 'What is your favorite programming language?',
      user_id: 'user-123',
      created_at: '2023-01-01T00:00:00.000Z'
    };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPollData),
    });
    
    render(<PollForm />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/poll title/i), 'Test Poll');
    await user.type(screen.getByLabelText(/description/i), 'This is a test poll description');
    await user.type(screen.getByLabelText(/poll question/i), 'What is your favorite programming language?');
    
    const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
    await user.type(optionInputs[0], 'JavaScript');
    await user.type(optionInputs[1], 'TypeScript');
    
    await user.click(screen.getByText('Create Poll'));
    
    // Verify the response data structure
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(`/polls/${mockPollData.id}`);
    });
    
    // Verify that the mock data has the expected structure
    expect(mockPollData).toHaveProperty('id');
    expect(mockPollData).toHaveProperty('title');
    expect(mockPollData).toHaveProperty('description');
    expect(mockPollData).toHaveProperty('question');
    expect(mockPollData).toHaveProperty('user_id');
    expect(mockPollData).toHaveProperty('created_at');
  });
});
# Polling App - Poll Results Feature Specification

## Overview
This document outlines the implementation details for the Poll Results feature, which allows users to view detailed voting statistics and visualizations for their created polls.

## Feature Components

### 1. Results Page
- **Route**: `/results/[pollId]`
- **Access Control**: Authenticated users can only view results for polls they've created
- **Components**:
  - Results page (SSR)
  - Loading state
  - Error boundary
  - Results visualization component

### 2. API Endpoints

#### GET `/api/polls/[pollId]`
- **Purpose**: Fetch poll results data
- **Authentication**: Required
- **Response**:
  ```typescript
  {
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
  }
  ```

## Database Schema

### Tables

#### `polls`
- `id` (UUID, PK)
- `question` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `user_id` (UUID, FK to auth.users)

#### `poll_options`
- `id` (UUID, PK)
- `poll_id` (UUID, FK to polls)
- `text` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### `votes`
- `id` (UUID, PK)
- `poll_id` (UUID, FK to polls)
- `option_id` (UUID, FK to poll_options)
- `user_id` (UUID, FK to auth.users)
- `created_at` (TIMESTAMPTZ)

## Security Requirements

### Row Level Security (RLS) Policies
```sql
-- Allow users to view their own poll results
CREATE POLICY "Users can view their own poll results"
ON polls FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to see options for their polls
CREATE POLICY "Users can view options for their polls"
ON poll_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM polls 
  WHERE polls.id = poll_options.poll_id 
  AND polls.user_id = auth.uid()
));

-- Allow users to see vote counts for their polls
CREATE POLICY "Users can view vote counts for their polls"
ON votes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM polls 
  WHERE polls.id = votes.poll_id 
  AND polls.user_id = auth.uid()
));
```

## UI/UX Requirements

### Results Page
1. **Header**: Poll question
2. **Visualization**: Bar chart showing vote distribution
3. **Summary Table**:
   - Option text
   - Number of votes
   - Percentage of total votes
4. **Metadata**:
   - Total votes
   - Creation date
   - Time remaining (if applicable)

### Loading States
- Show skeleton loader while fetching data
- Display error state if data loading fails
- Handle empty state (no votes yet)

## Performance Considerations

### Client-Side
- Use `React.lazy` for chart component
- Implement data fetching with `react-query` or SWR
- Add skeleton loaders for better perceived performance

### Server-Side
- Cache API responses with appropriate headers
- Implement pagination for polls with many votes
- Use database indexes on frequently queried columns

## Testing Requirements

### Unit Tests
- Test result calculation logic
- Test access control rules
- Test error handling

### Integration Tests
- Test API endpoint responses
- Test authentication/authorization flows
- Test data visualization rendering

## Future Enhancements
1. Real-time updates using Supabase Realtime
2. Export results as CSV/PDF
3. Shareable public links (view-only)
4. Advanced analytics (vote trends over time)
5. User demographics (if available)

## Dependencies
- `@supabase/supabase-js` - Database client
- `chart.js` - Data visualization
- `react-chartjs-2` - React wrapper for Chart.js
- `zod` - Data validation
- `date-fns` - Date formatting

'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { submitVote, type VoteResponse } from '@/app/actions/vote';

type VotingFormProps = {
  pollId: string;
  options: {
    id: string;
    text: string;
  }[];
};

// Define the form schema with Zod
const formSchema = z.object({
  optionId: z.string({
    required_error: "Please select an option before submitting",
  }).min(1, "Please select an option before submitting"),
});

export default function VotingForm({ pollId, options }: VotingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      optionId: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.optionId) {
      form.setError("optionId", {
        type: "manual",
        message: "Please select an option before submitting"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      // Create FormData for server action
      const formData = new FormData();
      formData.append('pollId', pollId);
      formData.append('optionId', values.optionId);
      
      // Call the server action
      const response = await submitVote(formData);
      
      if (response.success) {
        // Show success message
        setIsSuccess(true);
        
        // After a delay, show results
        setTimeout(() => {
          setIsSuccess(false);
          setShowResults(true);
        }, 2000);
      } else {
        setErrorMessage(response.message || 'Failed to submit vote');
      }
      
    } catch (error) {
      console.error('Error submitting vote:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Display results placeholder
  if (showResults) {
    return (
      <div className="mt-6 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-medium mb-4">Results</h3>
        <p className="text-gray-600 mb-4">Thank you for voting!</p>
        
        {/* Placeholder for actual results */}
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between">
                <span>{option.text}</span>
                <span className="font-medium">{Math.floor(Math.random() * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full mt-6" 
          variant="outline"
          onClick={() => setShowResults(false)}
        >
          Vote Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Cast your vote</h3>
      
      {isSuccess ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 mb-4">
          <p>Your vote has been submitted successfully!</p>
        </div>
      ) : null}
      
      {errorMessage ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 mb-4">
          <p>{errorMessage}</p>
        </div>
      ) : null}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="optionId"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Select an option</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted cursor-pointer">
                        <RadioGroupItem 
                          value={option.id} 
                          id={option.id}
                          required
                          aria-required="true"
                          aria-invalid={form.formState.errors.optionId ? "true" : "false"}
                        />
                        <Label htmlFor={option.id} className="flex-grow cursor-pointer">{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
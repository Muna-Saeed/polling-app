'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  question: z.string().min(10, {
    message: 'Poll question must be at least 10 characters long.',
  }),
  options: z.array(
    z.string().min(1, { message: 'Option cannot be empty.' })
  ).min(2, { message: 'At least 2 options are required.' }),
});

export default function PollForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionCount, setOptionCount] = useState(2);
  const router = useRouter();

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({    
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      question: '',
      options: ['', ''],
    },
  });

  // Add a new option field
  const addOption = () => {
    const currentOptions = form.getValues().options || [];
    form.setValue('options', [...currentOptions, '']);
    setOptionCount(prev => prev + 1);
  };

  // Remove an option field
  const removeOption = (index: number) => {
    const currentOptions = form.getValues().options || [];
    if (currentOptions.length <= 2) return; // Maintain at least 2 options
    
    const newOptions = [...currentOptions];
    newOptions.splice(index, 1);
    form.setValue('options', newOptions);
    setOptionCount(prev => prev - 1);
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create poll');
      }

      const data = await response.json();
      router.push(`/polls/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create a New Poll</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poll Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter poll title" {...field} />
                </FormControl>
                <FormDescription>
                  Give your poll a clear, descriptive title.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter poll description" {...field} />
                </FormControl>
                <FormDescription>
                  Provide details about what you're polling for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poll Question</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your poll question" {...field} />
                </FormControl>
                <FormDescription>
                  The main question you want people to answer (at least 10 characters).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Poll Options</FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addOption}
              >
                Add Option
              </Button>
            </div>
            
            {Array.from({ length: optionCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`options.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {optionCount > 2 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <FormMessage>{form.formState.errors.options?.message}</FormMessage>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
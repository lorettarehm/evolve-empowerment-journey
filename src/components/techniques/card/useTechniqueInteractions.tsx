
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTechniqueInteractions = (id: string, title: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  // Get existing interactions for this technique
  const { data: interactionStats, refetch: refetchStats } = useQuery({
    queryKey: ['techniqueInteractionStats', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technique_interactions')
        .select('feedback')
        .eq('technique_id', id);
        
      if (error) throw error;
      
      const helpfulCount = data?.filter(i => i.feedback === 'helpful').length || 0;
      const notHelpfulCount = data?.filter(i => i.feedback === 'not-helpful').length || 0;
      
      return { helpfulCount, notHelpfulCount };
    },
    enabled: !!id,
  });

  // Check if user has interacted with this technique
  const { data: userInteraction, refetch: refetchUserInteraction } = useQuery({
    queryKey: ['userTechniqueInteraction', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('technique_interactions')
        .select('id, feedback')
        .eq('technique_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) return null;
      return data;
    },
    enabled: !!id && !!user,
  });

  const handleFeedback = async (feedback: 'helpful' | 'not-helpful') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to provide feedback",
        variant: "destructive",
      });
      return;
    }

    // If user already gave this feedback, remove it (toggle)
    const shouldRemove = userInteraction?.feedback === feedback;
    
    try {
      if (shouldRemove) {
        // Delete the interaction
        const { error } = await supabase
          .from('technique_interactions')
          .delete()
          .eq('id', userInteraction.id);
          
        if (error) throw error;
        setFeedbackSubmitted(null);
      } else {
        if (userInteraction?.id) {
          // Update existing interaction
          const { error } = await supabase
            .from('technique_interactions')
            .update({
              feedback: feedback,
              created_at: new Date().toISOString(),
            })
            .eq('id', userInteraction.id);
            
          if (error) throw error;
        } else {
          // Insert new interaction
          const { error } = await supabase
            .from('technique_interactions')
            .insert({
              user_id: user.id,
              technique_id: id,
              technique_title: title,
              feedback: feedback,
              created_at: new Date().toISOString(),
            });
            
          if (error) throw error;
        }
        
        setFeedbackSubmitted(feedback);
      }
      
      // Refetch stats and user interaction
      refetchStats();
      refetchUserInteraction();
      
      // Invalidate any queries related to technique interactions in profile
      queryClient.invalidateQueries({ queryKey: ['techniqueInteractions'] });
      
      toast({
        title: shouldRemove ? "Feedback removed" : "Feedback submitted",
        description: shouldRemove 
          ? "Your feedback has been removed" 
          : `You marked this technique as ${feedback}`,
      });
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save your feedback",
        variant: "destructive",
      });
    }
  };

  // Use feedback from server or local state
  const currentFeedback = userInteraction?.feedback || feedbackSubmitted;

  return {
    interactionStats,
    currentFeedback,
    handleFeedback
  };
};

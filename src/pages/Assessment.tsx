
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AssessmentContent from '@/components/assessment/AssessmentContent';
import CompletionMessage from '@/components/assessment/CompletionMessage';
import LoadingState from '@/components/assessment/LoadingState';
import { useAssessmentQuestions } from '@/hooks/useAssessmentQuestions';
import { useAssessment } from '@/hooks/useAssessment';

const Assessment = () => {
  const { questions, loading } = useAssessmentQuestions(5);
  const {
    state: { currentQuestionIndex, answers, completed },
    setQuestions,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleComplete
  } = useAssessment();
  
  // Set questions in assessment state when loaded
  React.useEffect(() => {
    if (!loading && questions.length > 0) {
      setQuestions(questions);
    }
  }, [loading, questions, setQuestions]);
  
  if (loading) {
    return <LoadingState />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {!completed ? (
            <AssessmentContent
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              onAnswer={handleAnswer}
              onPrevious={handlePrevious}
              onNext={handleNext}
              questions={questions}
            />
          ) : (
            <CompletionMessage 
              onComplete={handleComplete}
              assessmentResults={answers}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Assessment;

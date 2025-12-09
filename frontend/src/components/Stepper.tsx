import { Check } from 'lucide-react';

interface StepperProps {
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isComplete = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <li
              key={step.number}
              className={`relative ${
                stepIdx !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex items-center">
                {/* Step circle */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isComplete
                        ? 'bg-primary-600 border-primary-600'
                        : isCurrent
                        ? 'border-primary-600 bg-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step info */}
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent || isComplete ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>

                {/* Connector line */}
                {stepIdx !== steps.length - 1 && (
                  <div className="ml-4 flex-1 hidden md:block">
                    <div
                      className={`h-0.5 w-full transition-all ${
                        isComplete ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


import { Keyboard, Mic, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Keyboard,
    title: 'Real-Time Typing Test',
    description: 'Track your WPM, accuracy, and errors with live feedback as you type.',
    color: 'primary',
    route: '/practice',
  },
  {
    icon: Mic,
    title: 'Voice & Communication Practice',
    description: 'Improve pronunciation, fluency, and get a confidence score for your speech.',
    color: 'accent',
    route: '/voice-practice',
  },
  {
    icon: MessageSquare,
    title: 'HR Interview Practice',
    description: 'Practice common interview questions with voice recording and instant feedback.',
    color: 'orange',
    route: '/voice-practice/hr',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description: 'Visualize your improvement with charts, streaks, and detailed history.',
    color: 'success',
    route:'/dashboard'
  },
  {
    icon: Sparkles,
    title: 'AI Feedback',
    description: 'Get smart suggestions powered by AI to accelerate your improvement.',
    color: 'primary',
    route: '#',
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();
  const getColorClasses = (color: string) => {
    const colors = {
      primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
      accent: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
      orange: 'bg-orange-accent/10 text-orange-accent group-hover:bg-orange-accent group-hover:text-primary-foreground',
      success: 'bg-success/10 text-success group-hover:bg-success group-hover:text-primary-foreground',
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(186_100%_50%/0.05)_0%,transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-mono text-sm tracking-wider uppercase mb-4 block">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to{' '}
            <span className="gradient-text">Excel</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A comprehensive platform designed to improve both your typing speed and communication skills.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.route)}
              className="group glass rounded-2xl p-8 card-hover cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${getColorClasses(feature.color)}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const CTASection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(186_100%_50%/0.15)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(280_100%_65%/0.1)_0%,transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icons */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center animate-float">
              <Keyboard className="w-8 h-8 text-primary" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
              <Mic className="w-8 h-8 text-accent" />
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Ready to Level Up Your{' '}
            <br className="hidden md:block" />
            <span className="gradient-text">Typing & Speaking?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of users who have transformed their communication skills. Start your journey today — it's completely free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="group" onClick={() => navigate('/practice')}>
              Start Free Practice
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            {!isAuthenticated && (
              <Button variant="heroOutline" size="xl" onClick={openLoginModal}>
                Create Account
              </Button>
            )}
          </div>

          {/* Trust Badges */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Free forever tier • Join 50,000+ users
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

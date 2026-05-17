import { Keyboard, Mic, Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { label: 'Typing Test', href: '#typing' },
    { label: 'Voice Practice', href: '#voice' },
    { label: 'Dashboard', href: '#' },
    { label: 'Pricing', href: '#' },
  ];

  const resources = [
    { label: 'Blog', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'FAQs', href: '#' },
    { label: 'Tutorials', href: '#' },
  ];

  const legal = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ];

  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Keyboard className="w-8 h-8 text-primary" />
                <Mic className="w-4 h-4 text-accent absolute -bottom-1 -right-1" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-foreground">Type</span>
                <span className="gradient-text">Speak</span>
                <span className="text-muted-foreground font-medium"> Pro</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              The all-in-one platform to improve your typing speed and communication skills for interviews, placements, and professional growth.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://github.com"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            2025 TypeSpeak Pro. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">
            Made with ❤️ Sufal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

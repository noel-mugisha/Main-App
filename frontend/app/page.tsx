'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  BarChart3, 
  Feather, 
  Globe, 
  Lock, 
  Shield, 
  Users, 
  Zap
} from 'lucide-react'
import { motion, Variants } from 'framer-motion'

export default function LandingPage() {
  const handleSignIn = () => {
    const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || 'http://localhost:8080'
    window.location.href = idpUrl
  }

  const features = [
    {
      icon: <Users className="h-8 w-8 text-indigo-400" />,
      title: "Seamless Collaboration",
      description: "Empower your team with role-based access and real-time updates for synchronized workflows."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-400" />,
      title: "Insightful Analytics",
      description: "Gain a competitive edge with comprehensive dashboards and detailed project reporting."
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-400" />,
      title: "Enterprise-Grade Security",
      description: "Built on a foundation of security with JWT authentication and robust data protection."
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-400" />,
      title: "Accelerated Workflow",
      description: "Stay ahead with instant notifications and a fluid, responsive user experience."
    }
  ]
  
  const FADE_IN_UP_VARIANTS : Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Gradient Shapes */}
      <div className="absolute top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <Feather className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                MainApp
              </span>
            </div>
            <Button 
              onClick={handleSignIn}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/40 transition-shadow"
              asChild
            >
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <motion.div 
          className="container mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.2 } }
          }}
        >
          <motion.h1 
            variants={FADE_IN_UP_VARIANTS}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Elevate Your Workflow.
            </span>
            <br />
            Unleash Your Potential.
          </motion.h1>
          
          <motion.p 
            variants={FADE_IN_UP_VARIANTS}
            className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Streamline projects, accelerate collaboration, and achieve your goals faster than ever with our intuitive and powerful management platform.
          </motion.p>
          
          <motion.div 
            variants={FADE_IN_UP_VARIANTS}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              onClick={handleSignIn}
              size="lg" 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-lg px-8 py-6 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300"
              asChild
            >
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={FADE_IN_UP_VARIANTS}
          >
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover a suite of powerful features designed to help you manage projects, collaborate effectively, and drive results.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={FADE_IN_UP_VARIANTS}>
                <Card className="border-border/80 h-full bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader className="items-center text-center pb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={FADE_IN_UP_VARIANTS}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of innovative teams who are already building their best work on MainApp.
            </p>
            <Button 
              onClick={handleSignIn}
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-6 shadow-2xl hover:shadow-white/40"
              asChild
            >
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Lock className="mr-2 h-5 w-5" />
                Sign In & Get Started
              </motion.button>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 text-muted-foreground">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Feather className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">MainApp</span>
          </div>
          <p className="mb-4">
            © {new Date().getFullYear()} MainApp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
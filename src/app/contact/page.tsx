'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'البريد الإلكتروني غير صالح';
    if (!formData.subject.trim()) newErrors.subject = 'الموضوع مطلوب';
    if (!formData.message.trim()) newErrors.message = 'الرسالة مطلوبة';
    else if (formData.message.trim().length < 10)
      newErrors.message = 'الرسالة قصيرة جداً، يجب أن تكون 10 أحرف على الأقل';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
    setTimeout(() => setIsSuccess(false), 5000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'العنوان',
      details: ['العاصمة، الجزائر', 'شارع الأمير عبد القادر'],
    },
    {
      icon: Phone,
      title: 'الهاتف',
      details: ['+213 21 000 000', '+213 555 000 000'],
    },
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      details: ['info@businfo.dz', 'support@businfo.dz'],
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      details: ['الأحد - الخميس: 9:00 - 18:00', 'الجمعة والسبت: مغلق'],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-navy text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">اتصل بنا</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو اقتراح وسنرد عليك في
            أقرب وقت ممكن
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">أرسل لنا رسالة</h2>
                    <p className="text-sm text-muted-foreground">املأ النموذج أدناه وسنتواصل معك</p>
                  </div>
                </div>

                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">تم الإرسال بنجاح!</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      شكراً لتواصلك معنا. سنقوم بمراجعة رسالتك والرد عليك خلال 24
                      ساعة عمل.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          الاسم الكامل <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="أدخل اسمك الكامل"
                          className={`h-10 rounded-lg ${errors.name ? 'border-red-400' : ''}`}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                          البريد الإلكتروني <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="example@email.com"
                          dir="ltr"
                          className={`h-10 rounded-lg text-left ${errors.email ? 'border-red-400' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                        الموضوع <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        placeholder="موضوع الرسالة"
                        className={`h-10 rounded-lg ${errors.subject ? 'border-red-400' : ''}`}
                      />
                      {errors.subject && (
                        <p className="text-xs text-red-500">{errors.subject}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-foreground">
                        الرسالة <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={6}
                        className={`rounded-lg resize-none ${errors.message ? 'border-red-400' : ''}`}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full sm:w-auto bg-navy hover:bg-navy-light text-white rounded-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 me-2 animate-spin" />
                          جارٍ الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 me-2" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info Cards */}
            <div className="lg:col-span-2 space-y-4">
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className="border-border/50 hover:border-gold/30 hover:shadow-md transition-all"
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                      <info.icon className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Quick Note Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-navy to-navy-dark text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-gold" />
                  <h3 className="text-sm font-bold">سجّل كمورد</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  هل أنت مورد أو مصنع؟ سجّل مجاناً في منصة بزنس إنفو واعرض
                  منتجاتك أمام آلاف المشترين
                </p>
                <Button
                  size="sm"
                  className="bg-gold hover:bg-gold-dark text-white rounded-lg text-xs"
                >
                  سجّل الآن
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder Section */}
      <section className="py-16 md:py-20 bg-[var(--bg-light)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">موقعنا</h2>
            <p className="text-muted-foreground text-sm">العاصمة، الجزائر</p>
          </div>
          <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl bg-gradient-to-br from-navy/5 to-navy/10 border border-border/30 flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-navy/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">خريطة الموقع</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                العاصمة، الجزائر - شارع الأمير عبد القادر
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

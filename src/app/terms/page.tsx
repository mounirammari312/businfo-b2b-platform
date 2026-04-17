import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calendar } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-navy text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">شروط الاستخدام</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            يرجى قراءة شروط الاستخدام بعناية قبل استخدام منصة بزنس إنفو
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Last Updated */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Calendar className="w-4 h-4" />
            <span>آخر تحديث: يناير 2025</span>
          </div>

          {/* Intro */}
          <div className="prose prose-slate max-w-none mb-10">
            <p className="text-muted-foreground leading-relaxed text-base">
              مرحباً بك في منصة بزنس إنفو (المشار إليها بـ &quot;المنصة&quot; أو &quot;بزنس إنفو&quot;). باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل المتابعة. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {/* تعريفات */}
            <TermsSection title="1. تعريفات">
              <p className="text-muted-foreground leading-relaxed text-sm mb-3">
                في هذه الشروط والأحكام، يشير المصطلحات التالية إلى:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">المنصة:</strong> موقع بزنس إنفو الإلكتروني وجميع الخدمات المرتبطة به، بما في ذلك التطبيقات والصفحات الرسمية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">المستخدم:</strong> أي شخص طبيعي أو اعتباري يسجّل حساباً على المنصة ويستخدم خدماتها.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">المورد:</strong> المستخدم المسجّل كشركة أو مصنع يعرض منتجاته وخدماته على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">المشتري:</strong> المستخدم الذي يبحث عن منتجات وخدمات ويتواصل مع الموردين عبر المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">المحتوى:</strong> جميع النصوص والصور والبيانات والمعلومات المنشورة على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span><strong className="text-foreground">الخدمات:</strong> جميع الوظائف والميزات التي توفرها المنصة للمستخدمين.</span></li>
              </ul>
            </TermsSection>

            {/* شروط التسجيل */}
            <TermsSection title="2. شروط التسجيل">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.1</span><span>يجب أن يكون عمرك 18 عاماً على الأقل أو تمتلك الأهلية القانونية للتعاقد.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.2</span><span>يجب تقديم معلومات صحيحة ودقيقة وكاملة عند التسجيل ومراجعة تحديثها بشكل دوري.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.3</span><span>يجب الحفاظ على سرية بيانات حسابك وكلمة المرور، وأنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.4</span><span>يُحظر إنشاء أكثر من حساب واحد لنفس الشخص أو الكيان دون إذن كتابي مسبق من إدارة المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.5</span><span>للموردين: يجب تقديم الوثائق القانونية المطلوبة لاعتماد الحساب، بما في ذلك السجل التجاري ووثائق النشاط.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.6</span><span>تحتفظ المنصة بحق رفض أي طلب تسجيل أو إلغاء حساب موجود دون إبداء الأسباب.</span></li>
              </ul>
            </TermsSection>

            {/* شروط الاستخدام */}
            <TermsSection title="3. شروط الاستخدام">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.1</span><span>يجب استخدام المنصة للأغراض المشروعة فقط ووفقاً للقوانين المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.2</span><span>يُحظر نشر أي محتوى غير قانوني أو مسيء أو مضايق أو ينتهك حقوق الغير الفكرية أو الملكية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.3</span><span>يُحظر استخدام المنصة لإرسال رسائل مزعجة أو إعلانات غير مصرح بها أو بريد إلكتروني عشوائي.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.4</span><span>يُحظر محاولة الوصول غير المصرح به إلى أنظمة المنصة أو بيانات المستخدمين الآخرين.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.5</span><span>يُحظر استخدام أدوات آلية أو برمجيات لاستخراج البيانات من المنصة دون إذن كتابي.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.6</span><span>يجب على الموردين تقديم معلومات دقيقة عن منتجاتهم وأسعارهم وضمان توفر المنتجات المعروضة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.7</span><span>يُحظر التلاعب بأسعار المنتجات أو التقييمات أو أي بيانات على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.8</span><span>يُحظر تقديم عروض أو إجراء صفقات خارج نطاق المنصة بقصد التهرب من الرسوم أو الشروط.</span></li>
              </ul>
            </TermsSection>

            {/* الملكية الفكرية */}
            <TermsSection title="4. الملكية الفكرية">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.1</span><span>جميع حقوق الملكية الفكرية المتعلقة بالمنصة، بما في ذلك التصميم والشعارات والأسماء التجارية والبرمجيات، هي ملكية حصرية لمنصة بزنس إنفو.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.2</span><span>لا يجوز نسخ أو إعادة إنتاج أو توزيع أو تعديل أي جزء من المنصة دون إذن كتابي مسبق.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.3</span><span>يحتفظ المورد بملكية المحتوى الذي ينشره، لكنه يمنح المنصة ترخيصاً غير حصري لاستخدام هذا المحتوى لأغراض عرضه وتسويقه على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.4</span><span>يُحظر استخدام علامات بزنس إنفو التجارية أو شعاراتها دون إذن كتابي مسبق.</span></li>
              </ul>
            </TermsSection>

            {/* إخلاء المسؤولية */}
            <TermsSection title="5. إخلاء المسؤولية">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.1</span><span>المنصة هي وسيط إلكتروني يربط بين الموردين والمشترين، وليست طرفاً في المعاملات التجارية التي تتم بينهما.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.2</span><span>لا تتحمل المنصة أي مسؤولية عن جودة المنتجات أو دقة المعلومات التي ينشرها الموردون.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.3</span><span>لا تضمن المنصة استمرارية الخدمة أو خلوها من الأخطاء أو المقاطعات التقنية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.4</span><span>لا تتحمل المنصة مسؤولية أي خسائر مالية أو أضرار ناتجة عن المعاملات بين المستخدمين.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.5</span><span>المنصة ليست مسؤولة عن محتوى مواقع الطرف الثالث التي يمكن الوصول إليها من خلال روابط على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.6</span><span>يبذل المستخدمون جهدهم للتحقق من دقة المعلومات، لكن المنصة لا تضمن دقة أو اكتمال جميع المعلومات المعروضة.</span></li>
              </ul>
            </TermsSection>

            {/* التعديلات */}
            <TermsSection title="6. التعديلات والإنهاء">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.1</span><span>تحتفظ المنصة بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين بأي تعديلات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.2</span><span>استمرارك في استخدام المنصة بعد نشر التعديلات يُعتبر موافقة ضمنية منك على الشروط المعدّلة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.3</span><span>يمكنك إنهاء حسابك في أي وقت من خلال إعدادات الحساب أو بتقديم طلب إلى فريق الدعم.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.4</span><span>تحتفظ المنصة بحق تعليق أو إلغاء أي حساب يخالف هذه الشروط والأحكام دون إنذار مسبق.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.5</span><span>في حال الإنهاء أو التعليق، لا يحق لك المطالبة بأي تعويض عن البيانات أو المحتوى المفقود.</span></li>
              </ul>
            </TermsSection>

            {/* القانون المعمول به */}
            <TermsSection title="7. القانون المعمول به">
              <p className="text-sm text-muted-foreground leading-relaxed">
                تخضع هذه الشروط والأحكام وتُفسّر وفقاً لقوانين الجمهورية الجزائرية الديمقراطية الشعبية. في حال نشوب أي نزاع، يتم حله ودياً أولاً، وفي حال تعذر ذلك، يُحال إلى المحاكم المختصة في العاصمة الجزائر.
              </p>
            </TermsSection>

            {/* التواصل */}
            <TermsSection title="8. التواصل">
              <p className="text-sm text-muted-foreground leading-relaxed">
                لأي استفسارات حول هذه الشروط والأحكام، يمكنك التواصل معنا عبر:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني: <span dir="ltr" className="text-foreground font-medium">legal@businfo.dz</span></p>
                <p className="text-sm text-muted-foreground mt-1">الهاتف: <span dir="ltr" className="text-foreground font-medium">+213 21 000 000</span></p>
                <p className="text-sm text-muted-foreground mt-1">العنوان: العاصمة، الجزائر</p>
              </div>
            </TermsSection>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">هل تحتاج مساعدة؟</p>
            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="text-sm text-navy hover:text-gold-dark font-medium transition-colors"
              >
                تواصل معنا
              </Link>
              <span className="text-border">|</span>
              <Link
                href="/privacy"
                className="text-sm text-navy hover:text-gold-dark font-medium transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <span className="text-border">|</span>
              <Link
                href="/faq"
                className="text-sm text-navy hover:text-gold-dark font-medium transition-colors"
              >
                الأسئلة الشائعة
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border/50">{title}</h2>
      {children}
    </div>
  );
}

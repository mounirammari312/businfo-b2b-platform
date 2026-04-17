import React from 'react';
import Link from 'next/link';
import { Calendar, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-navy text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">سياسة الخصوصية</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية وفقاً للتشريعات
            الجزائرية
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
          <div className="mb-10">
            <p className="text-muted-foreground leading-relaxed text-base">
              تلتزم منصة بزنس إنفو (المشار إليها بـ &quot;المنصة&quot; أو &quot;بزنس إنفو&quot; أو &quot;نحن&quot;) بحماية خصوصية مستخدميها والتعامل مع بياناتهم الشخصية بأقصى درجات الأمان والسرية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام ومشاركة المعلومات التي نحصل عليها من خلال استخدامك للمنصة.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {/* جمع البيانات */}
            <PrivacySection title="1. جمع البيانات">
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                نقوم بجمع أنواع مختلفة من المعلومات لتقديم خدماتنا وتحسين تجربة المستخدم:
              </p>

              <h3 className="text-base font-semibold text-foreground mb-2">أ. البيانات التي تقدمها مباشرة:</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>الاسم الكامل واسم المستخدم</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>عنوان البريد الإلكتروني ورقم الهاتف</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>اسم الشركة والسجل التجاري (للموردين)</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>العنوان الفعلي للشركة</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>الوثائق القانونية المطلوبة للتسجيل</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>معلومات المنتجات والخدمات المنشورة</span></li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mb-2">ب. البيانات التي يتم جمعها تلقائياً:</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>عنوان IP ونوع المتصفح ونظام التشغيل</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>صفحات المنصة التي تزورها ومدة الزيارة</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>محفوظات البحث والتصفح على المنصة</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>معلومات الجهاز المستخدم للوصول إلى المنصة</span></li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mb-2">ج. البيانات من مصادر أخرى:</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>التقييمات والمراجعات التي يقدمها المستخدمون</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">-</span><span>معلومات التواصل المتبادلة بين المستخدمين</span></li>
              </ul>
            </PrivacySection>

            {/* استخدام البيانات */}
            <PrivacySection title="2. استخدام البيانات">
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                نستخدم البيانات التي نجمعها للأغراض التالية:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.1</span><span>إنشاء وإدارة حسابك وتقديم الخدمات الأساسية للمنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.2</span><span>التحقق من هوية المستخدمين واعتماد حسابات الموردين.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.3</span><span>تحسين وتطوير المنصة وتجربة المستخدم بناءً على أنماط الاستخدام.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.4</span><span>إرسال إشعارات مهمة حول حسابك ونشاطك على المنصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.5</span><span>إرسال رسائل تسويقية ونبذات إخبارية (يمكن إلغاء الاشتراك في أي وقت).</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.6</span><span>منع الاحتيال وحماية أمن المنصة والمستخدمين.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.7</span><span>الامتثال للمتطلبات القانونية والتنظيمية المعمول بها.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">2.8</span><span>تقديم إحصائيات وتقارير لأصحاب الحسابات الموردة حول أداء حساباتهم.</span></li>
              </ul>
            </PrivacySection>

            {/* مشاركة البيانات */}
            <PrivacySection title="3. مشاركة البيانات">
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك بياناتك في الحالات التالية:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.1</span><span><strong className="text-foreground">بين المستخدمين:</strong> يتم عرض معلومات المورد العامة (الاسم، العنوان، المنتجات) للمشترين لتمكين التواصل التجاري.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.2</span><span><strong className="text-foreground">مقدمي الخدمات:</strong> قد نشارك بيانات مع مقدمي خدمات تقنية موثوقين لضمان تشغيل المنصة (استضافة، تحليلات).</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.3</span><span><strong className="text-foreground">الأغراض القانونية:</strong> قد نكشف عن البيانات استجابة لأمر قضائي أو طلب قانوني من الجهات المختصة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.4</span><span><strong className="text-foreground">حماية الحقوق:</strong> قد نشارك البيانات لحماية حقوق المنصة أو سلامة المستخدمين أو الملكية الفكرية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">3.5</span><span><strong className="text-foreground">الاندماج أو الاستحواذ:</strong> في حال اندماج المنصة مع جهة أخرى، سيتم إشعارك بشأن نقل بياناتك.</span></li>
              </ul>
            </PrivacySection>

            {/* ملفات تعريف الارتباط */}
            <PrivacySection title="4. ملفات تعريف الارتباط (Cookies)">
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك على المنصة:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.1</span><span><strong className="text-foreground">ملفات تعريف الارتباط الأساسية:</strong> ضرورية لتشغيل المنصة وتسجيل الدخول وتذكر تفضيلاتك.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.2</span><span><strong className="text-foreground">ملفات تعريف الارتباط التحليلية:</strong> تساعدنا على فهم كيفية استخدام المنصة وتحسين أدائها.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.3</span><span><strong className="text-foreground">ملفات تعريف الارتباط التسويقية:</strong> تُستخدم لتقديم إعلانات ملائمة لاهتماماتك.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">4.4</span><span>يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات متصفحك. يرجى ملاحظة أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على وظائف المنصة.</span></li>
              </ul>
            </PrivacySection>

            {/* حماية البيانات */}
            <PrivacySection title="5. حماية البيانات">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.1</span><span>نتخذ إجراءات أمنية مناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفشاء أو التلف.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.2</span><span>نستخدم تقنيات التشفير الحديثة لحماية البيانات أثناء النقل والتخزين.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.3</span><span>نقوم بإجراء مراجعات أمنية دورية لأنظمتنا وبروتوكولاتنا.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.4</span><span>يتم تقييد الوصول إلى البيانات الشخصية على الموظفين المصرح لهم فقط الذين يحتاجون إليها لأداء مهامهم.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">5.5</span><span>رغم جهودنا، لا يوجد نظام أمني مثالي بنسبة 100%. سنقوم بإشعارك فوراً في حال حدوث أي اختراق أمني يؤثر على بياناتك.</span></li>
              </ul>
            </PrivacySection>

            {/* حقوقك */}
            <PrivacySection title="6. حقوقك">
              <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                وفقاً للتشريعات المعمول بها، لك الحقوق التالية فيما يتعلق ببياناتك الشخصية:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.1</span><span><strong className="text-foreground">الحق في الوصول:</strong> يمكنك طلب نسخة من بياناتك الشخصية المخزنة لدينا.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.2</span><span><strong className="text-foreground">الحق في التصحيح:</strong> يمكنك طلب تصحيح أي بيانات شخصية غير دقيقة أو غير مكتملة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.3</span><span><strong className="text-foreground">الحق في الحذف:</strong> يمكنك طلب حذف بياناتك الشخصية، مع مراعاة بعض الاستثناءات القانونية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.4</span><span><strong className="text-foreground">الحق في الاعتراض:</strong> يمكنك الاعتراض على معالجة بياناتك الشخصية لأغراض تسويقية.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.5</span><span><strong className="text-foreground">الحق في النقل:</strong> يمكنك طلب نقل بياناتك الشخصية إلى خدمة أخرى بتنسيق قابل للقراءة.</span></li>
                <li className="flex gap-2"><span className="text-navy font-bold shrink-0">6.6</span><span><strong className="text-foreground">حق الانسحاب:</strong> يمكنك سحب موافقتك على معالجة بياناتك في أي وقت عبر إعدادات حسابك أو التواصل معنا.</span></li>
              </ul>
            </PrivacySection>

            {/* الاحتفاظ بالبيانات */}
            <PrivacySection title="7. الاحتفاظ بالبيانات">
              <p className="text-muted-foreground leading-relaxed text-sm">
                نحتفظ ببياناتك الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم خدماتنا. في حال إغلاق حسابك، سنحتفظ ببعض البيانات للامتثال للالتزامات القانونية وحل النزاعات وإنفاذ اتفاقياتنا. فترة الاحتفاظ تعتمد على طبيعة البيانات والغرض من جمعها، وتتراوح عادة بين سنة إلى خمس سنوات بعد انتهاء العلاقة مع المنصة.
              </p>
            </PrivacySection>

            {/* تعديلات سياسة الخصوصية */}
            <PrivacySection title="8. تعديلات سياسة الخصوصية">
              <p className="text-muted-foreground leading-relaxed text-sm">
                نحتفظ بحق تعديل سياسة الخصوصية هذه في أي وقت. سنقوم بإشعارك بأي تعديلات جوهرية عبر البريد الإلكتروني أو إشعار واضح على المنصة قبل سريان التعديلات. ننصحك بمراجعة هذه السياسة بشكل دوري للبقاء على اطلاع بكيفية حماية بياناتك. استمرارك في استخدام المنصة بعد نشر التعديلات يُعتبر موافقة ضمنية على السياسة المحدثة.
              </p>
            </PrivacySection>

            {/* التواصل */}
            <PrivacySection title="9. التواصل">
              <p className="text-muted-foreground leading-relaxed text-sm mb-3">
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه أو ممارسات حماية البيانات لدينا، يمكنك التواصل معنا عبر:
              </p>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني: <span dir="ltr" className="text-foreground font-medium">privacy@businfo.dz</span></p>
                <p className="text-sm text-muted-foreground mt-1">الهاتف: <span dir="ltr" className="text-foreground font-medium">+213 21 000 000</span></p>
                <p className="text-sm text-muted-foreground mt-1">العنوان: العاصمة، الجزائر</p>
                <p className="text-sm text-muted-foreground mt-1">مسؤول حماية البيانات: <span dir="ltr" className="text-foreground font-medium">dpo@businfo.dz</span></p>
              </div>
            </PrivacySection>
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
                href="/terms"
                className="text-sm text-navy hover:text-gold-dark font-medium transition-colors"
              >
                شروط الاستخدام
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

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border/50">{title}</h2>
      {children}
    </div>
  );
}

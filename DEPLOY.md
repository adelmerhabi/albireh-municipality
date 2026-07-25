# نشر موقع بلدية البيرة على Cloudflare

هذه التعليمات تنشر الموقع وD1 وR2 داخل حساب تملكه البلدية. الرابط الحالي
للـ Worker هو:

`https://baladiya.albireh.workers.dev`

تعتمد حدود الاستخدام والتكلفة على خطة Cloudflare الفعلية وقت النشر؛ راجع
لوحة الحساب قبل الإطلاق ولا تعتمد على أرقام قديمة مكتوبة في المستودع.

## 1. المتطلبات

- حساب Cloudflare تملكه البلدية.
- Node.js `>=22.13.0`.
- صلاحية نشر Worker وإدارة D1 وR2 في الحساب.
- نسخة نظيفة من المستودع.

```bash
npm ci
npx wrangler login
```

لا تضع كلمات المرور أو الرموز أو ملفات `.env` في Git.

## 2. تحديد موارد الإنتاج

إذا كان الموقع منشوراً مسبقاً، **أعد استخدام D1 وR2 الحاليين** حتى لا تظهر
قاعدة فارغة أو تضيع المرفقات. اعرض الموارد المسجلة في الحساب:

```bash
npx wrangler d1 list
npx wrangler r2 bucket list
```

الإعدادات القديمة تستخدم غالباً `site-creator-d1` و`site-creator-r2`؛ تحقق من
لوحة Cloudflare ولا تفترض الاسم. احفظ اسم D1 و`database_id` واسم حاوية R2.

فقط عند تركيب جديد لا يملك موارد سابقة، أنشئ موارد بأسماء واضحة:

```bash
npx wrangler d1 create albireh-municipality-db
npx wrangler r2 bucket create albireh-municipality-media
```

في بقية التعليمات، استبدل `YOUR_DATABASE_NAME` و`YOUR_R2_BUCKET_NAME` بالقيم
الفعلية نفسها في كل نشر.

## 3. بناء نسخة الإنتاج

macOS أو Linux:

```bash
CF_D1_DATABASE_ID="<database-id>" \
CF_D1_DATABASE_NAME="YOUR_DATABASE_NAME" \
CF_R2_BUCKET_NAME="YOUR_R2_BUCKET_NAME" \
npm run build
```

Windows PowerShell:

```powershell
$env:CF_D1_DATABASE_ID="<database-id>"
$env:CF_D1_DATABASE_NAME="YOUR_DATABASE_NAME"
$env:CF_R2_BUCKET_NAME="YOUR_R2_BUCKET_NAME"
npm run build
```

يبني الأمر Worker في `dist/server` والملفات العامة في `dist/client`. افحص
`dist/server/wrangler.json` وتأكد أن اسم Worker هو `baladiya` وأن D1 وR2
يشيران إلى موارد الإنتاج الصحيحة، وأن `migrations_dir` يشير إلى مجلد
`drizzle/` في جذر المشروع.

## 4. تطبيق migrations

### قاعدة جديدة لم تستقبل أي طلب بعد

بعد نجاح build، طبّق السلسلة كاملة قبل أول deploy:

```bash
npx wrangler d1 migrations apply YOUR_DATABASE_NAME --remote --config dist/server/wrangler.json
```

راجع نتيجة الأمر وتأكد من تطبيق جميع الملفات الظاهرة.

### قاعدة حالية سبق أن شغّلت الموقع

لا تشغّل السلسلة كاملة بشكل أعمى. الإصدارات السابقة كانت تستطيع إنشاء الجداول
عبر `db/runtime.ts` من دون تسجيلها في جدول migrations، ولذلك قد يحاول Wrangler
إنشاء جداول موجودة أصلاً ويفشل. قبل الترقية:

1. صدّر نسخة احتياطية.
2. افحص سجل migrations وحالة schema على نسخة staging.
3. جهّز ترقية idempotent تم التحقق منها لهذه القاعدة، أو دع
   `ensureRuntimeSchema` الحالي يصالح الجداول والأعمدة التي يدعمها.
4. لا تعدّل migration قديماً ولا تحذف بيانات لتجاوز خطأ.

`db/runtime.ts` يهيئ الجداول في قاعدة فارغة ويصالح بعض الأعمدة القديمة كشبكة
أمان. عند اعتماد تتبع migrations رسمياً، أنشئ baseline موثقاً على نسخة staging
قبل تغيير قاعدة الإنتاج.

## 5. أول نشر

```bash
cd dist/server
npx wrangler deploy
```

النشر الأول ينشئ Worker إن لم يكن موجوداً. لن يعمل دخول الإدارة قبل ضبط
الأسرار في الخطوة التالية، بينما يجب أن يبقى الموقع العام قابلاً للفتح.

## 6. إعداد حساب الاستعادة والأسرار

من `dist/server`، اضبط القيم التالية عندما يطلبها Wrangler:

```bash
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put ADMIN_BOOTSTRAP_USERNAME
npx wrangler secret put ADMIN_BOOTSTRAP_PASSWORD_HASH
npx wrangler secret put ADMIN_BOOTSTRAP_DISPLAY_NAME
```

ولّد `ADMIN_SESSION_SECRET` عشوائياً، مثلاً:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

يجب أن يكون hash كلمة المرور بصيغة PBKDF2-SHA256 مع **100,000 iteration**،
وهو الحد المتوافق مع Cloudflare Workers الذي يستخدمه
`app/lib/passwords.ts`.

Windows PowerShell (استبدل `YOUR_PASSWORD` محلياً ولا تحفظه في history
مشترك):

```powershell
$p='YOUR_PASSWORD'
$s=[byte[]]::new(16)
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($s)
$k=[System.Security.Cryptography.Rfc2898DeriveBytes]::new([Text.Encoding]::UTF8.GetBytes($p),$s,100000,'SHA256')
'pbkdf2-sha256$100000$'+[Convert]::ToBase64String($s)+'$'+[Convert]::ToBase64String($k.GetBytes(32))
```

macOS أو Linux:

```bash
node -e 'const c=require("node:crypto");const s=c.randomBytes(16);const k=c.pbkdf2Sync("YOUR_PASSWORD",s,100000,32,"sha256");console.log("pbkdf2-sha256$100000$"+s.toString("base64")+"$"+k.toString("base64"))'
```

بعد ضبط الأسرار:

1. افتح `/admin/login`.
2. جرّب الدخول والخروج بحساب الاستعادة.
3. أنشئ/تحقق من حساب الموظف الثاني إن كان مطلوباً.
4. أدخل معلومات التواصل المعتمدة من تبويب «معلومات التواصل».
5. لا تشارك حساباً واحداً بين عدة موظفين.

لا تضبط `ENABLE_SAMPLE_CONTENT` في الإنتاج. هذا المتغير مخصص فقط للمعاينة
المحلية، وتفعيله يعرض مواد تجريبية عندما تكون قاعدة المحتوى فارغة.

## 7. النشر بعد أي تعديل

من فرع موثوق وبعد نجاح CI:

```bash
npm ci
npm run lint
npm test
```

ثم أعد أوامر build في الخطوة 3 باستخدام موارد الإنتاج، وطبّق الخطوة 4 إذا
أضيف migration جديد، وبعدها:

```bash
cd dist/server
npx wrangler deploy
```

لا تحذف D1 أو R2 عند إعادة نشر الكود؛ البيانات منفصلة عن نسخة Worker.

## 8. فحص ما بعد النشر

- افتح الصفحة الرئيسية وصفحة تفاصيل منشور من الهاتف والكمبيوتر.
- جرّب الأنواع الأربعة والحقول الديناميكية وحملة Wish تجريبية غير منشورة.
- عدّل مادة موجودة وجرّب تعطيل حساب الموظف ثم تحقق من انتهاء جلسته.
- احفظ معلومات التواصل وتأكد من ظهور الحقول غير الفارغة فقط للزائر.
- ارفع صورة وملفاً وتأكد من ظهورهما في المحتوى العام.
- أرسل طلب ساكن تجريبياً وتأكد أن مرفقه لا يفتح من دون جلسة Admin.
- تحقق من `/robots.txt` و`/sitemap.xml` و`/privacy`.
- راجع logs للأخطاء ثم احذف بيانات الاختبار.

## 9. النسخ الاحتياطي والاستعادة

صدّر D1 إلى ملف مؤرّخ خارج مجلد المستودع:

```bash
npx wrangler d1 export YOUR_DATABASE_NAME --remote --output "albireh-db-backup.sql"
```

انسخ محتوى R2 دورياً إلى مساحة منفصلة تملكها البلدية باستخدام أداة متوافقة
مع R2 أو من خلال إجراءات الحساب. قاعدة البيانات وحدها لا تتضمن الصور.

الحد الأدنى التشغيلي المقترح:

- نسخة D1 يومية مع الاحتفاظ بدورة مناسبة.
- نسخة R2 أسبوعية وبعد الرفع الكبير.
- اختبار استعادة فعلي كل ثلاثة أشهر.
- حماية النسخ وتحديد من يمكنه تنزيلها.
- حذف النسخ التي تتجاوز مدة سياسة الخصوصية.

## 10. النطاق

اسم Worker الحالي هو `baladiya`، ولذلك يبقى رابط Workers المجاني
`baladiya.albireh.workers.dev` ما دام subdomain الحساب هو `albireh`.

لإضافة نطاق رسمي، أضفه من إعدادات **Workers & Pages → Domains & Routes**
بعد أن تملكه البلدية وتضبط DNS. تسجيل نطاق `gov.lb` وإثبات الصفة الرسمية
إجراء إداري منفصل يجب تنسيقه مع الجهة اللبنانية المعتمدة. إضافة النطاق لا
تتطلب تغيير الكود.

## 11. التراجع عند وجود مشكلة

أوقف النشر إذا فشل migration أو اختبار الدخول. استخدم سجل إصدارات Worker في
Cloudflare لإعادة نسخة كود سابقة، ولا ترجع schema قاعدة البيانات عشوائياً.
استعادة البيانات تتم فقط من نسخة احتياطية مع التحقق من أثرها على السجلات
الجديدة.

## قائمة القيم اليدوية

| القيمة | المكان | ملاحظة |
| --- | --- | --- |
| `CF_D1_DATABASE_ID` | بيئة build | id قاعدة D1 الفعلية |
| `CF_D1_DATABASE_NAME` | بيئة build | اسم قاعدة الإنتاج |
| `CF_R2_BUCKET_NAME` | بيئة build | اسم حاوية الإنتاج |
| `ADMIN_SESSION_SECRET` | Worker secret | قيمة عشوائية طويلة |
| `ADMIN_BOOTSTRAP_USERNAME` | Worker secret | حساب استعادة مخصص |
| `ADMIN_BOOTSTRAP_PASSWORD_HASH` | Worker secret | hash بـ 100,000 iteration |
| `ADMIN_BOOTSTRAP_DISPLAY_NAME` | Worker secret | الاسم الظاهر في اللوحة |

# 🛍️ TC Gift Shop — Modern E-Commerce Application

**TC Gift Shop**, modern web teknolojileri ve esnek bir veritabanı mimarisi üzerine kurulu, son kullanıcı deneyimi ile gelişmiş operasyonel yönetim süreçlerini tek bir çatı altında birleştiren yeni nesil bir cross-platform e-ticaret ve yönetim yazılımıdır. 

Proje, özellikle dinamik varyant yönetimi, akıllı stok kontrol mekanizmaları, kupon stratejileri ve otomatik pazarlama/iletişim araçlarıyla tam donanımlı kurumsal bir altyapı sunmaktadır.

---

## 🚀 Öne Çıkan Özellikler ve İşleyiş Mantığı

Yazılım, karmaşık e-ticaret süreçlerini arka planda tamamen otomatik ve güvenli bir şekilde yönetebilmek adına modüler bir yapıda kurgulanmıştır:

### ⚡ Varyant ve Canlı Vitrin Mimarisi
*   **Gelişmiş Varyant Entegrasyonu:** Ürünler sadece statik birer başlık ve açıklamadan ibaret değildir. Her ürün; renk, boyut ve bunlara bağlı özel görseller ile fiyat farklarını barındıran dinamik bir varyant şemasına sahiptir.
*   **Vitrinde Listeleme:** Kullanıcılar ürün detay sayfasına girmeden önce, ana vitrin ve kategori sayfalarında ürün kartlarının hemen altında mevcut renk/varyant seçeneklerini canlı önizleme olarak görebilirler.
*   **Sepet ve Sipariş Mühürleme:** Kullanıcı sepete bir varyant eklediğinde, sistem ana ürün yerine seçilen varyantın görselini ve fiyatını taşır. Sipariş tamamlandığında bu veriler kalıcı olarak veritabanına mühürlenir; böylece admin ileride ana ürünü güncellese bile geçmişe dönük sipariş kayıtları görsel ve varyant ismi bazında kusursuz kalır.

### ⚙️ Akıllı Stok ve Tetikleyici (Trigger) Motoru
Veritabanının kalbinde çalışan bağımsız tetikleyiciler sayesinde, e-ticaretin en büyük problemi olan stok senkronizasyon hataları tamamen önlenmiştir:
*   **Sipariş Yayını:** Sipariş ilk oluşturulduğunda (`PENDING`), stoklar hemen düşmez. Bu sayede sahte siparişlerin veya başarısız ödemelerin stoğu bloke etmesi engellenir.
*   **Otomatik Azalma:** Sipariş admin tarafından onaylandığı (`APPROVED`) an, sistem arka planda satın alınan varyant adetlerini depodan otomatik olarak düşer.
*   **Çift Yönlü İptal ve İade:** 
    *   Sipariş henüz onaylanmamışken kullanıcı iptal ederse, stoktan hiç düşülmediği için sisteme müdahale edilmez ve mükerrer stok artışı önlenir.
    *   Onaylanmış bir sipariş admin tarafından iptal edilirse veya bir iptal talebi (`CANCEL_REQUESTED`) onaylanıp süreç `CANCELLED` moduna girerse, ilgili varyant stokları saniyeler içinde **otomatik olarak depoya geri yüklenir**.

### 🏷️ Pazarlama ve Operasyon Araçları
*   **Dinamik Kargo Baremi:** Sepet ve ödeme akışı akıllı bir barem sistemine bağlıdır. Belirlenen limitin (örneğin 1500 TL) üzerindeki alışverişlerde kargo tamamen ücretsiz olurken, limit altındaki sepetlere otomatik olarak kargo ücreti yansıtılır.
*   **Kupon (Discount) Yönetimi:** Yönetim paneli üzerinden yüzde bazlı (`PERCENTAGE`) veya sabit tutarlı (`FIXED`) kupon kodları tanımlanabilir. Sistem, bu tipleri ön yüzde hatasız ayrıştırarak sepet toplamından doğru indirimi düşürür.
*   **E-Posta Otomasyonları (Resend):** Yazılım, kurumsal iletişim ve pazarlama gücünü artırmak amacıyla üç farklı otomatik e-posta senaryosu barındırır:
    1.  *İletişim Formu:* Siteden gelen ziyaretçi mesajlarını anında admin kutusuna taşır.
    2.  *İptal Bildirimi:* Siparişi iptal edilen müşteriye anında bilgilendirme uyarısı fırlatır.
    3.  *Sepet Hatırlatıcı (Cart Abandonment):* Sepetinde ürün bırakıp ayrılan kararsız kullanıcıları admin panelinde listeler ve tek tuşla müşteriye özel sepet hatırlatma e-postası gönderilmesini sağlar.

---

## 🛠️ Teknik Altyapı ve Teknoloji Yığını

Proje, yüksek performans, hız, tip güvenliği ve esneklik odağıyla modern web ekosisteminin en güçlü oyuncularıyla inşa edilmiştir:

*   **Frontend / UI:** Next.js (App Router) mimarisi kullanılarak geliştirilmiştir. Tasarım dilinde modern, gözü yormayan ve premium bir görünüm sunan **Dark Zinc (Koyu Tema)** estetiği benimsenmiştir.
*   **Backend & API:** Next.js Route Handlers (API Routes) üzerinden modüler servisler yazılmıştır.
*   **Veritabanı (Database):** Supabase (PostgreSQL) altyapısı tercih edilmiştir. Tüm veri ilişkileri, ilişkisel veritabanı (RDBMS) standartlarına uygun olarak tasarlanmış, şema önbellek (schema cache) optimizasyonları yapılmış ve stok yönetiminin tamamı güvenli SQL fonksiyonları ve Trigger mimarileriyle doğrudan veritabanı seviyesinde çözülmüştür.
*   **Tip Güvenliği:** Projenin tamamı uçtan uca veri kayıplarını ve çalışma zamanı (runtime) hatalarını engellemek amacıyla **TypeScript** kullanılarak zırhlanmıştır.
*   **E-Posta Servisi:** Yüksek gönderim hızı ve geliştirici dostu yapısı nedeniyle arkada **Resend API** servis sağlayıcısı görev yapmaktadır.

---

## 📁 Mimari ve Klasör Yapısı

Kod karmaşasını önlemek, yapay zeka modelleriyle yapılan ortak geliştirmelerde kod bütünlüğünü korumak ve bakım süreçlerini kolaylaştırmak adına proje **Bileşen Bazlı (Componentization)** modüler mimariye sahiptir:

*   Dehasal sayfalar (örneğin Admin ana sayfası) tek bir dosya halinde tutulmak yerine; sipariş tablosunu yöneten, kuponları kontrol eden ve sepette kalanları izleyen bağımsız alt bileşenlere (`OrderManagement.tsx`, `CouponManager.tsx`, `AbandonedCarts.tsx`) bölünmüştür.
*   Ana sayfalar sadece bu bileşenleri şık bir sekme (Tab) sistemiyle koordine eden hafif ve temiz bir yapıya kavuşturulmuştur.

---

*Bu proje, işlevsel tasarımı güçlü bir veritabanı mühendisliğiyle birleştiren esnek ve ölçeklenebilir bir e-ticaret ürünüdür.*

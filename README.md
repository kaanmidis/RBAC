# 🔐 RBAC & Audit Log System

Node.js ve PostgreSQL kullanılarak geliştirilmiş, rol ve yetki bazlı erişim kontrolü (RBAC) ile detaylı audit log mekanizması içeren backend projesidir.

---

## 🚀 Özellikler

### 🔑 Authentication
- Session tabanlı kullanıcı girişi
- Şifreler bcrypt ile hashlenir
- Başarılı ve başarısız login denemeleri loglanır

### 🛡️ Authorization (RBAC)
- Role-Based Access Control (RBAC)
- Kullanıcı → Rol → Yetki ilişkisi
- Middleware ile permission kontrolü
- OWNER / ADMIN / USER / AUDITOR rol hiyerarşisi

### 📜 Audit Log Sistemi
- Tüm kritik işlemler kayıt altına alınır:
  - Giriş (LOGIN_SUCCESS / LOGIN_FAILED)
  - Yetkisiz erişim denemeleri
  - Kullanıcı işlemleri (disable/enable)
  - Rol değişiklikleri
- Log detayları:
  - İşlemi yapan kullanıcı
  - Hedef kullanıcı (varsa)
  - IP adresi
  - Açıklama
  - Zaman

### 👥 Kullanıcı Yönetimi
- Kullanıcı listeleme
- Kullanıcı aktif/pasif etme (soft delete)
- Rol atama / değiştirme
- Yetkisiz işlemler engellenir ve loglanır

### 🔐 Güvenlik Önlemleri
- Kendi hesabını devre dışı bırakamazsın
- OWNER rolü korunur (değiştirilemez)
- Yetki hiyerarşisi kontrol edilir
- Transaction (BEGIN / COMMIT / ROLLBACK) kullanımı

---

## 🧠 Kullanılan Teknolojiler

- Node.js
- Express.js
- PostgreSQL
- EJS (View)
- bcryptjs
- express-session

---

## 📂 Veritabanı Yapısı (Özet)

- users
- roles
- permissions
- user_roles
- role_permissions
- audit_logs

---

## ⚙️ Kurulum

### 1. Projeyi klonla
```bash
git clone https://github.com/kullaniciadi/rbac-audit-log-system.git
cd rbac-audit-log-system
```
### 2. Paketleri yükle
```bash
npm install
```

### 3. .env dosyası oluştur
```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=rbac_db
SESSION_SECRET=your_secret_key
```
### 4. Veritabanını kur
```bash
veri_tabani_kurulum.txt dosyasını PostgreSQL üzerinde çalıştır.
```
### 5. Projeyi başlat
```bash
npm run dev
```

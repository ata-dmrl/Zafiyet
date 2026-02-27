XAS – Extended Analysis System v2.0.0
Gelişmiş Güvenlik Analiz Konsolu (Nmap + ZAP + Parser + Fix Rehberi + Raporlama)

XAS, hem ağ hem de web uygulaması güvenlik testlerinde kullanılmak üzere tasarlanmış,
modüler, genişletilebilir ve tamamen CLI tabanlı bir güvenlik analiz aracıdır.
Beyaz şapka güvenlik uzmanları için tasarlanmıştır.

Özellikler:
✅ Akıllı tarama (IP/domain otomatik algılama)
✅ Nmap hızlı ve tam tarama
✅ ZAP hızlı ve tam tarama
✅ scan full – Nmap + ZAP birleşik tarama
✅ Otomatik araç kontrolü (Nmap/ZAP kurulu mu?)
✅ 19 zafiyet türü için detaylı fix rehberi
✅ Zafiyet arama ve filtreleme
✅ Severity bazlı renk kodlu çıktı
✅ TXT, HTML ve JSON rapor oluşturma
✅ CSV ve JSON dışa aktarma
✅ Tab completion desteği
✅ Modüler runner ve parser mimarisi

------------------------------------------------------------
# 📁 PROJE YAPISI
------------------------------------------------------------

xas/
 ├─ package.json
 ├─ node_modules/
 ├─ reports/
 ├─ src/
 │   ├─ index.js            Ana giriş (REPL + tab completion)
 │   ├─ commands.js          Tüm komut yönetimi
 │   ├─ toolCheck.js         Araç kurulum kontrolü
 │   ├─ issue.js             Zafiyet veri modeli
 │   ├─ fixGuides.js         19 zafiyet fix rehberi
 │   ├─ banner.js            Renkli ASCII banner
 │   ├─ parsers/
 │   │   ├─ nmap.js          Nmap XML parser (10+ port eşleme)
 │   │   └─ zap.js           ZAP JSON parser (20+ alert eşleme)
 │   ├─ runners/
 │   │   ├─ nmapRunner.js    Nmap çalıştırıcı
 │   │   └─ zapRunner.js     ZAP çalıştırıcı
 │   └─ reportGenerator.js   TXT + HTML + JSON rapor
 └─ README.md

------------------------------------------------------------
# 🚀 BAŞLANGIÇ
------------------------------------------------------------

## 1- Projeyi başlat
```bash
npm install
npm start
```

Konsol açıldığında:
```
██   ██  █████  ███████
 ██ ██  ██   ██ ██
  ███   ███████  █████
 ██ ██  ██   ██      ██
██   ██ ██   ██ ███████
────────────────────────────────────────
        X A S   S E C U R I T Y
   Active Recon & Analysis Framework
        v2.0.0 | Beyaz Şapka Aracı
────────────────────────────────────────

[*] Araç Durumu Kontrolü
─────────────────────────────────────────────
  ✔ Nmap  → Kurulu
  ✘ ZAP   → Kurulu değil
─────────────────────────────────────────────

XAS Security Console v2.0.0
Komutlar için 'help' yazın.

xas>
```

------------------------------------------------------------
# AKILLI TARAMA
------------------------------------------------------------

### IP adresi taraması (otomatik Nmap):
```bash
xas> scan 192.168.1.10
```

### Web adresi taraması (otomatik ZAP):
```bash
xas> scan https://hedef.com
```

### Kapsamlı tarama (Nmap + ZAP birlikte):
```bash
xas> scan full 192.168.1.10
```

------------------------------------------------------------
# NMAP KOMUTLARI
------------------------------------------------------------

### Hızlı Nmap taraması:
```bash
xas> run nmap -sV 192.168.1.10
```

### Tam Nmap taraması:
```bash
xas> run nmap full 192.168.1.10
```

### Nmap XML raporu yükleme:
```bash
xas> load nmap scan.xml
```

------------------------------------------------------------
# ZAP KOMUTLARI
------------------------------------------------------------

### Hızlı ZAP taraması:
```bash
xas> run zap https://hedef.com
```

### Tam ZAP taraması:
```bash
xas> run zap full https://hedef.com
```

### ZAP JSON raporu yükleme:
```bash
xas> load zap zap.json
```

------------------------------------------------------------
# ZAFİYET YÖNETİMİ
------------------------------------------------------------

### Tüm zafiyetler (severity sıralı):
```bash
xas> list
```

### Severity filtreleme:
```bash
xas> list sev=critical
xas> list sev=high
xas> list sev=medium
xas> list sev=low
xas> list sev=info
```

### Zafiyet arama:
```bash
xas> search sql
xas> search CVE-2021
```

### Zafiyet detayı:
```bash
xas> detail 3
```

------------------------------------------------------------
# ZAFİYET ÇÖZÜM REHBERİ
------------------------------------------------------------

```bash
xas> fix 3
```

Desteklenen zafiyet türleri:
- SQL Injection (critical)
- Command Injection (critical)
- Telnet açık port (high)
- FTP açık port (high)
- RDP açık port (high)
- SMB açık port (high)
- MySQL açık port (high)
- MSSQL açık port (high)
- VNC açık port (high)
- Redis açık port (high)
- MongoDB açık port (high)
- SSL/TLS sorunları (high)
- DNS Zone Transfer (high)
- Zayıf şifre politikası (high)
- XSS (medium)
- CSRF (medium)
- CORS yanlış yapılandırma (medium)
- Directory Listing (medium)
- HTTP Proxy açık (medium)
- SSH zayıf yapılandırma (medium)
- Open Redirect (medium)
- Güvenlik başlıkları eksik (low)

------------------------------------------------------------
# İSTATİSTİK
------------------------------------------------------------

```bash
xas> stats
```

Örnek çıktı:
```
──── Zafiyet İstatistikleri ────

CRITICAL   ████░░░░░░░░░░░░░░░░ 2
HIGH       ████████████████████ 5
MEDIUM     ██████████████░░░░░░ 7
LOW        ██████░░░░░░░░░░░░░░ 3
INFO       ██░░░░░░░░░░░░░░░░░░ 1

Toplam: 18 zafiyet

Kaynak Dağılımı:
  NMAP    : 10
  ZAP     : 8
```

------------------------------------------------------------
# RAPORLAMA VE DIŞA AKTARMA
------------------------------------------------------------

### Tüm raporları oluştur (TXT + HTML + JSON):
```bash
xas> report
```

### JSON dışa aktarma:
```bash
xas> export json
```

### CSV dışa aktarma:
```bash
xas> export csv
```

Oluşan dosyalar:
```
reports/report.txt
reports/report.html
reports/report.json
reports/report.csv
```

------------------------------------------------------------
# ARAÇ DURUMU
------------------------------------------------------------

```bash
xas> tools
```

------------------------------------------------------------
# ÇIKIŞ
------------------------------------------------------------

```bash
xas> exit
```

------------------------------------------------------------
# GELİŞTİRİLEBİLİR MİMARİ
------------------------------------------------------------

XAS tamamen modülerdir:
- Yeni parser eklenebilir (parsers/ klasörü)
- Yeni runner eklenebilir (runners/ klasörü)
- Yeni fix rehberleri eklenebilir (fixGuides.js)
- Yeni komutlar eklenebilir (commands.js)

------------------------------------------------------------
## LİSANS
------------------------------------------------------------

Bu proje geliştiricinin kullanımına özeldir.

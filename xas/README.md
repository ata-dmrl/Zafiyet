XAS – Extended Analysis System
Gelişmiş Güvenlik Analiz Konsolu (Nmap + ZAP + Parser + Fix Rehberi + Raporlama)

XAS, hem ağ hem de web uygulaması güvenlik testlerinde kullanılmak üzere tasarlanmış,
modüler, genişletilebilir ve tamamen CLI tabanlı bir güvenlik analiz konsoludur.

Özellikler:
✅ Nmap hızlı tarama
✅ Nmap tam tarama
✅ ZAP hızlı tarma
✅ ZAP tam tarama
✅ Nmap & ZAP çıktılarını otomatik parse etme
✅ Her zafiyet için çözüm rehberi (fix guide)
✅ TXT & HTML rapor oluşturma
✅ Modüler runner ve parser mimarisi

------------------------------------------------------------
# 📁 PROJE YAPISI
------------------------------------------------------------

xas/
 ├─ package.json
 ├─ node_modules/
 ├─ reports/
 ├─ src/
 │   ├─ index.js
 │   ├─ commands.js
 │   ├─ issue.js
 │   ├─ fixGuides.js
 │   ├─ parsers/
 │   │   ├─ nmap.js
 │   │   └─ zap.js
 │   ├─ runners/
 │   │   ├─ nmapRunner.js
 │   │   └─ zapRunner.js
 │   └─ reportGenerator.js
 └─ README.txt

------------------------------------------------------------
# 🚀BAŞLANGIÇ
------------------------------------------------------------

## 1-Projeyi başlat
```Bash
    npm install
    npm start
```
Konsol açıldığında:
```Bash
    XAS Security Console (Node.js)
    Type 'help' for commands.
    xas>
```
------------------------------------------------------------
# XAS KOMUTLARI
------------------------------------------------------------

### 1- Yardım:
```Bash
    xas> help
```
------------------------------------------------------------
# NMAP KOMUTLARI
------------------------------------------------------------

### Hızlı Nmap taraması:
```Bash
    xas> run nmap -sV 192.168.1.10
```
### Tam Nmap taraması:
```Bash
    xas> run nmap full 192.168.1.10
```
### Nmap XML raporu yükleme:
```Bash
    xas> load nmap scan.xml
```
------------------------------------------------------------
# ZAP KOMUTLARI
------------------------------------------------------------

## Hızlı ZAP taraması:
```Bash
    xas> run zap https://hedef.com
```
Tam ZAP taraması:
```Bash
    xas> run zap full https://hedef.com
```
ZAP JSON raporu yükleme:
```Bash
    xas> load zap zap.json
```
------------------------------------------------------------
# ZAFİYET LİSTELEME
------------------------------------------------------------

Tüm zafiyetler:
```Bash
    xas> list
```
Severity filtreleme:
```Bash
    xas> list sev=critical
    xas> list sev=high
    xas> list sev=medium
    xas> list sev=low
    xas> list sev=info
```
------------------------------------------------------------
# ZAFİYET ÇÖZÜM REHBERİ
------------------------------------------------------------

Belirli bir zafiyetin çözüm rehberi:
    xas> fix <id>

Örnek:
    xas> fix 3

------------------------------------------------------------
# İSTATİSTİK
------------------------------------------------------------
Yaptığını taramaların sonucunu almak isterseniz
```Bash
    xas> stats
```
Örnek çıktı:
    CRITICAL: 2
    HIGH: 5
    MEDIUM: 7
    LOW: 3
    INFO: 1

------------------------------------------------------------
# RAPOR OLUŞTURMA (TXT + HTML)
------------------------------------------------------------
Yaptığınız tüm işlemler için vezafiyet raporu almak isterseniz
```Bash
    xas> report

Oluşan dosyalar:
    reports/report.txt
    reports/report.html
```
------------------------------------------------------------
# ÇIKIŞ
------------------------------------------------------------

    xas> exit

------------------------------------------------------------
# GELİŞTİRİLEBİLİR MİMARİ
------------------------------------------------------------

XAS tamamen modülerdir:
- Yeni parser eklenebilir
- Yeni runner eklenebilir
- Yeni fix rehberleri eklenebilir
- Yeni komutlar eklenebilir

------------------------------------------------------------
## LİSANS
------------------------------------------------------------

Bu proje geliştiricinin kullanımına özeldir.
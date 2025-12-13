// src/fixGuides.js

const FIX_GUIDES = {
  sql_injection: {
    severity: "critical",
    title: "SQL Injection",
    steps: [
      {
        title: "Parametreli sorgular kullanın",
        items: [
          "Prepared statements kullanın",
          "Bind parametreler ile kullanıcı girdisini ayırın"
        ]
      },
      {
        title: "ORM kullanın",
        items: [
          "Sequelize, Prisma, Hibernate, Entity Framework gibi ORM'ler kullanın"
        ]
      },
      {
        title: "Input validation uygulayın",
        items: [
          "Whitelist yaklaşımı kullanın",
          "Regex ile sadece beklenen karakterlere izin verin"
        ]
      }
    ],
    recommendation:
      "Kullanıcı girdisini asla doğrudan SQL sorgusunun içine string birleştirme ile eklemeyin."
  },

  command_injection: {
    severity: "critical",
    title: "Command Injection",
    steps: [
      {
        title: "Shell komutuna kullanıcı girdisi koymayın",
        items: [
          "exec('ping ' + userInput) gibi yapıları kullanmayın",
          "execFile veya parametre alan güvenli API'leri tercih edin"
        ]
      },
      {
        title: "Whitelist yaklaşımı uygulayın",
        items: [
          "Sadece önceden tanımlı komut veya parametreleri kabul edin"
        ]
      }
    ],
    recommendation:
      "Shell komutlarını minimuma indirin, mümkünse native API'ler üzerinden işlem yapın."
  },

  telnet: {
    severity: "high",
    title: "Telnet Service Açık",
    steps: [
      {
        title: "Telnet servisini kapatın (Linux)",
        items: [
          "sudo systemctl stop telnet",
          "sudo systemctl disable telnet"
        ]
      },
      {
        title: "Portu kapatın",
        items: [
          "sudo ufw deny 23",
          "Firewall üzerinde 23/TCP portunu engelleyin"
        ]
      }
    ],
    recommendation: "Telnet yerine SSH (22/TCP) kullanın, çünkü Telnet trafiği şifrelenmemiştir."
  },

  ftp: {
    severity: "high",
    title: "FTP Service Açık",
    steps: [
      {
        title: "Anonymous erişimi kapatın",
        items: [
          "vsftpd.conf içinde anonymous_enable=NO ayarlayın",
          "Konfigürasyonu yeniden yükleyin: sudo systemctl restart vsftpd"
        ]
      },
      {
        title: "Güvenli alternatife geçin",
        items: [
          "Mümkünse SFTP (SSH üzerinden) veya FTPS kullanın"
        ]
      }
    ],
    recommendation:
      "FTP trafiği şifrelenmemiştir, hassas veriler için daima şifreli protokoller kullanın."
  },

  rdp: {
    severity: "high",
    title: "RDP (3389/TCP) Açık",
    steps: [
      {
        title: "Sadece iç ağa açın",
        items: [
          "RDP'yi doğrudan internete açmayın",
          "VPN üzerinden erişim sağlayın"
        ]
      },
      {
        title: "NLA ve brute-force koruması",
        items: [
          "Network Level Authentication (NLA) etkinleştirin",
          "Hesap kilitleme politikaları ve brute-force koruması uygulayın"
        ]
      }
    ],
    recommendation:
      "RDP'yi mümkün olduğunca sınırlandırın ve mutlaka güçlü kimlik doğrulama uygulayın."
  },

  xss: {
    severity: "medium",
    title: "Cross-Site Scripting (XSS)",
    steps: [
      {
        title: "Output encoding uygulayın",
        items: [
          "Kullanıcı girdisini HTML çıktısına koymadan önce encode edin",
          "Temel olarak <, >, ', \" karakterlerini escape edin"
        ]
      },
      {
        title: "CSP (Content Security Policy) ekleyin",
        items: [
          "default-src 'self' gibi bir politika ile dış script yüklemelerini kısıtlayın"
        ]
      }
    ],
    recommendation:
      "XSS açıkları kullanıcı oturumlarının ele geçirilmesine neden olabilir, tüm kullanıcı girdilerini sanitize edin."
  },

  csrf: {
    severity: "medium",
    title: "Cross-Site Request Forgery (CSRF)",
    steps: [
      {
        title: "CSRF token mekanizması ekleyin",
        items: [
          "Her state-changing istekte zorunlu token kullanın",
          "Token'ı session ile ilişkilendirin"
        ]
      },
      {
        title: "SameSite cookie özelliğini kullanın",
        items: [
          "Set-Cookie: ...; SameSite=Lax veya Strict kullanın"
        ]
      }
    ],
    recommendation:
      "Özellikle kritik işlemleri (şifre değişikliği, para transferi vb.) CSRF koruması olmadan bırakmayın."
  }
  // Buraya zamanla yeni zafiyet türleri ekleyebilirsin
};

module.exports = {
  FIX_GUIDES
};
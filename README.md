🛒 E-Commerce Basket Microservice
Bu mikroservis, E-Ticaret projesinin Sepet Yönetimi işlemlerini üstlenir. Kullanıcıların ürünleri sepete eklemesini, çıkarmasını, sepeti görüntülemesini ve temizlemesini sağlar. Veri tutarlılığı için PostgreSQL ve ORM aracı olarak Hibernate kullanır.

📂 Proje Mimarisi ve Kod İncelemesi
Bu proje Katmanlı Mimari (Layered Architecture) prensiplerine göre tasarlanmıştır. Aşağıda her bir katmanın kodu ve ne işe yaradığı detaylıca açıklanmıştır.

1. Entity Katmanı (Veritabanı Modelleri)

Veritabanındaki tabloların Java tarafındaki karşılıklarıdır.

Basket.java (Sepet)

@Entity
@Data // Lombok: Getter, Setter ve toString metodlarını otomatik oluşturur.
@NoArgsConstructor
@AllArgsConstructor
public class Basket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId; // Hangi kullanıcıya ait?

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "basket_id") // ÖNEMLİ: 3. tablo oluşmasını engeller, ilişkiyi yönetir.
    private List<BasketItem> items = new ArrayList<>();
    
    // Sepet toplam tutarını hesaplayan yardımcı metot
    public BigDecimal getTotalPrice() {
        return items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

2. Repository Katmanı (Veri Erişim)

Veritabanı ile konuşan arayüzdür. SQL yazmadan işlem yapmamızı sağlar.

public interface BasketRepository extends JpaRepository<Basket, Long> {
    
    // Kullanıcı ID'sine göre sepeti bulur
    Optional<Basket> findByUserId(String userId);
}

3. Service Katmanı (İş Mantığı)

Tüm kuralların işletildiği yerdir (Stok var mı? Sepet yoksa oluştur vb.)

@Service
@RequiredArgsConstructor // Constructor Injection için
public class BasketService {

    private final BasketRepository repository;

    // Kullanıcının sepetini getir, yoksa yeni oluştur
    public Basket getBasketByUserId(String userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> {
                    Basket newBasket = new Basket();
                    newBasket.setUserId(userId);
                    return repository.save(newBasket);
                });
    }

    // Sepete ürün ekle
    @Transactional // İşlemler atomik olsun (hata olursa geri al)
    public void addItemToBasket(String userId, BasketItemRequest request) {
        Basket basket = getBasketByUserId(userId);
        
        // Sepette bu ürün daha önce var mı kontrol et
        Optional<BasketItem> existingItem = basket.getItems().stream()
                .filter(item -> item.getProductId().equals(request.productId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Varsa adeti artır
            existingItem.get().increaseQuantity(request.quantity());
        } else {
            // Yoksa yeni item oluştur
            BasketItem newItem = new BasketItem();
            newItem.setProductId(request.productId());
            newItem.setProductName(request.productName());
            newItem.setPrice(request.price());
            newItem.setQuantity(request.quantity());
            basket.getItems().add(newItem);
        }
        
        repository.save(basket);
    }
    
    public void clearBasket(String userId) {
        Basket basket = getBasketByUserId(userId);
        basket.getItems().clear();
        repository.save(basket);
    }
}

4. Controller Katmanı (API Uç Noktaları)

Dış dünyanın (Frontend veya Mobile App) bizim servisimizle konuştuğu kapıdır.

@RestController
@RequestMapping("/api/basket")
@RequiredArgsConstructor
public class BasketController {

    private final BasketService service;

    @GetMapping("/{userId}")
    public ResponseEntity<Basket> getBasket(@PathVariable String userId) {
        return ResponseEntity.ok(service.getBasketByUserId(userId));
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<Void> addItem(@PathVariable String userId, @RequestBody BasketItemRequest request) {
        service.addItemToBasket(userId, request);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearBasket(@PathVariable String userId) {
        service.clearBasket(userId);
        return ResponseEntity.noContent().build();
    }
}

⚙️ Configuration
Uygulamanın çalışması için gereken application.properties ayarları.

# Veritabanı Bağlantısı (Docker'daki Postgres)
spring.datasource.url=jdbc:postgresql://localhost:5432/basket_db
spring.datasource.username=postgres
spring.datasource.password=postgres

# Hibernate Ayarları
spring.jpa.hibernate.ddl-auto=update
# 'update': Tablolar yoksa oluşturur, varsa değiştirir. Veriyi silmez.
spring.jpa.show-sql=true
# Console da çalıştırılan SQL sorgularını gösterir (Debug için harika).
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect


# Run
<img width="1366" height="230" alt="image" src="https://github.com/user-attachments/assets/2ff70a49-f1b2-4b6b-bc42-c92bbc05c4af" />



# Geçici olarak manuel ürün ekleme
<img width="1390" height="122" alt="image" src="https://github.com/user-attachments/assets/e4b65075-b064-42c8-b761-17d2b8d35b22" />



# Sonuç
<img width="2740" height="274" alt="image" src="https://github.com/user-attachments/assets/b358aaba-4ef0-4af4-a078-7752cc4f3411" />



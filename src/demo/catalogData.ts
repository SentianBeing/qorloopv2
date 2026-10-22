// Realistic Qatar supermarket catalogue used by the demo seed.
// Tuple: [nameEn, nameAr, brand, size, categoryId, erpPrice (QAR), imageKey]
export type CatalogTuple = [string, string, string, string, string, number, string];

export const CATEGORIES: { id: string; nameEn: string; nameAr: string; erpName: string }[] = [
  { id: 'beverages', nameEn: 'Beverages', nameAr: 'المشروبات', erpName: 'BEVERAGES' },
  { id: 'dairy-eggs', nameEn: 'Dairy & Eggs', nameAr: 'الألبان والبيض', erpName: 'DAIRY' },
  { id: 'snacks-confectionery', nameEn: 'Snacks & Confectionery', nameAr: 'الوجبات الخفيفة والحلويات', erpName: 'SNACKS & CONFECTIONERY' },
  { id: 'bakery', nameEn: 'Bakery', nameAr: 'المخبوزات', erpName: 'BAKERY' },
  { id: 'pantry', nameEn: 'Pantry & Cooking', nameAr: 'المواد الغذائية والطبخ', erpName: 'GROCERY' },
  { id: 'breakfast', nameEn: 'Breakfast & Hot Drinks', nameAr: 'الإفطار والمشروبات الساخنة', erpName: 'BREAKFAST' },
  { id: 'frozen', nameEn: 'Frozen', nameAr: 'المجمدات', erpName: 'FROZEN' },
  { id: 'fruits-veg', nameEn: 'Fruits & Vegetables', nameAr: 'الفواكه والخضروات', erpName: 'FRESH PRODUCE' },
  { id: 'household', nameEn: 'Household & Cleaning', nameAr: 'المنزل والتنظيف', erpName: 'HOUSEHOLD' },
  { id: 'personal-care', nameEn: 'Personal Care', nameAr: 'العناية الشخصية', erpName: 'PERSONAL CARE' },
  { id: 'baby-care', nameEn: 'Baby Care', nameAr: 'مستلزمات الأطفال', erpName: 'BABY CARE' },
  { id: 'pet-care', nameEn: 'Pet Care', nameAr: 'مستلزمات الحيوانات الأليفة', erpName: 'PET CARE' },
];

/** Marketplace category names used in category mapping and new-product files. */
export const MARKETPLACE_CATEGORIES: Record<string, Record<string, string | null>> = {
  talabat: {
    beverages: 'Soft Drinks & Juices', 'dairy-eggs': 'Milk, Laban & Eggs', 'snacks-confectionery': 'Chips & Chocolates',
    bakery: 'Bread & Bakery', pantry: 'Food Cupboard', breakfast: 'Tea, Coffee & Cereals', frozen: 'Frozen Food',
    'fruits-veg': 'Fresh Fruits & Vegetables', household: 'Cleaning & Laundry', 'personal-care': 'Personal Care',
    'baby-care': 'Baby Care', 'pet-care': 'Pet Supplies',
  },
  snoonu: {
    beverages: 'Beverages', 'dairy-eggs': 'Dairy & Eggs', 'snacks-confectionery': 'Snacks & Sweets', bakery: 'Bakery',
    pantry: 'Pantry', breakfast: 'Breakfast', frozen: 'Frozen', 'fruits-veg': 'Fruits & Vegetables',
    household: 'Household', 'personal-care': 'Health & Beauty', 'baby-care': 'Baby', 'pet-care': 'Pets',
  },
  rafeeq: {
    beverages: 'Drinks', 'dairy-eggs': 'Dairy', 'snacks-confectionery': 'Snacks', bakery: 'Bakery', pantry: 'Grocery',
    breakfast: 'Breakfast', frozen: 'Frozen', 'fruits-veg': 'Fresh', household: 'Home Care',
    'personal-care': null, 'baby-care': null, 'pet-care': 'Pet Food',
  },
  keeta: {
    beverages: null, 'dairy-eggs': null, 'snacks-confectionery': null, bakery: null, pantry: null, breakfast: null,
    frozen: null, 'fruits-veg': null, household: null, 'personal-care': null, 'baby-care': null, 'pet-care': null,
  },
};

// Products already in the catalogue (listed on marketplaces).
export const CATALOG: CatalogTuple[] = [
  ['Pepsi 330ml Can', 'بيبسي علبة 330 مل', 'Pepsi', '330 ml', 'beverages', 2.5, 'pepsi'],
  ['Baladna Fresh Milk 1L', 'حليب بلدنا طازج 1 لتر', 'Baladna', '1 L', 'dairy-eggs', 7.0, 'baladna'],
  ["Lay's Salted 170g", 'ليز بالملح 170 جم', "Lay's", '170 g', 'snacks-confectionery', 8.5, 'lays'],
  ['Almarai Laban 180ml', 'لبن المراعي 180 مل', 'Almarai', '180 ml', 'dairy-eggs', 1.75, 'almarai'],
  ['Snickers 50g', 'سنيكرز 50 جم', 'Snickers', '50 g', 'snacks-confectionery', 3.25, 'snickers'],
  ['Al Ain Water 1.5L', 'مياه العين 1.5 لتر', 'Al Ain', '1.5 L', 'beverages', 2.0, 'alain'],
  ['Coca-Cola 1.5L', 'كوكا كولا 1.5 لتر', 'Coca-Cola', '1.5 L', 'beverages', 5.0, 'coke'],
  ['Nescafe Classic 200g', 'نسكافيه كلاسيك 200 جم', 'Nescafe', '200 g', 'breakfast', 18.0, 'nescafe'],
  ['Maggi Chicken Stock 20g', 'مرقة دجاج ماجي 20 جم', 'Maggi', '20 g', 'pantry', 1.25, 'maggi'],
  ['Pringles Original 165g', 'برينجلز الأصلي 165 جم', 'Pringles', '165 g', 'snacks-confectionery', 9.0, 'pringles'],
  ['KitKat 4 Finger 41.5g', 'كيت كات 4 أصابع 41.5 جم', 'KitKat', '41.5 g', 'snacks-confectionery', 4.0, 'kitkat'],
  ['Oreo Original 36.8g', 'أوريو الأصلي 36.8 جم', 'Oreo', '36.8 g', 'snacks-confectionery', 2.0, 'oreo'],
  ['Lurpak Butter 200g', 'زبدة لورباك 200 جم', 'Lurpak', '200 g', 'dairy-eggs', 12.5, 'lurpak'],
  ['Twix 50g', 'تويكس 50 جم', 'Twix', '50 g', 'snacks-confectionery', 3.0, 'twix'],
  ['Haribo Goldbears 100g', 'هاريبو الدببة الذهبية 100 جم', 'Haribo', '100 g', 'snacks-confectionery', 6.5, 'haribo'],
  ['Bounty 57g', 'باونتي 57 جم', 'Bounty', '57 g', 'snacks-confectionery', 3.0, 'bounty'],
  ['Coca-Cola 330ml Can', 'كوكا كولا علبة 330 مل', 'Coca-Cola', '330 ml', 'beverages', 2.5, 'coke'],
  ['7Up 330ml Can', 'سفن أب علبة 330 مل', '7Up', '330 ml', 'beverages', 2.5, ''],
  ['Mirinda Orange 330ml Can', 'ميرندا برتقال علبة 330 مل', 'Mirinda', '330 ml', 'beverages', 2.5, ''],
  ['Rani Orange Float 240ml', 'راني برتقال 240 مل', 'Rani', '240 ml', 'beverages', 2.25, ''],
  ['Almarai Orange Juice 1L', 'عصير برتقال المراعي 1 لتر', 'Almarai', '1 L', 'beverages', 9.5, ''],
  ['Tang Orange 375g', 'تانج برتقال 375 جم', 'Tang', '375 g', 'beverages', 11.0, ''],
  ['Al Ain Water 500ml x 12', 'مياه العين 500 مل × 12', 'Al Ain', '12 x 500 ml', 'beverages', 9.0, 'alain'],
  ['Baladna Laban 1L', 'لبن بلدنا 1 لتر', 'Baladna', '1 L', 'dairy-eggs', 6.0, 'baladna'],
  ['Almarai Full Fat Milk 1L', 'حليب المراعي كامل الدسم 1 لتر', 'Almarai', '1 L', 'dairy-eggs', 6.75, 'almarai'],
  ['Nadec Fresh Yoghurt 1kg', 'زبادي نادك طازج 1 كجم', 'Nadec', '1 kg', 'dairy-eggs', 8.5, ''],
  ['Kiri Cream Cheese 6 Portions', 'جبنة كيري 6 قطع', 'Kiri', '108 g', 'dairy-eggs', 7.25, ''],
  ['Puck Cream Cheese Jar 500g', 'جبنة بوك كريمي برطمان 500 جم', 'Puck', '500 g', 'dairy-eggs', 18.5, ''],
  ['Al Rawabi Fresh Eggs 30 pcs', 'بيض الروابي طازج 30 حبة', 'Al Rawabi', '30 pcs', 'dairy-eggs', 21.0, ''],
  ['Président Feta Cheese 200g', 'جبنة فيتا بريزيدون 200 جم', 'Président', '200 g', 'dairy-eggs', 9.75, ''],
  ['Lusine Sliced White Bread 600g', 'خبز لوزين أبيض شرائح 600 جم', 'Lusine', '600 g', 'bakery', 6.0, ''],
  ['Lusine Brown Bread 600g', 'خبز لوزين أسمر 600 جم', 'Lusine', '600 g', 'bakery', 6.5, ''],
  ['7Days Croissant Chocolate 55g', 'كرواسون سفن دايز شوكولاتة 55 جم', '7Days', '55 g', 'bakery', 2.0, ''],
  ['Al Alali Tuna Sunflower Oil 170g', 'تونة العلالي بزيت دوار الشمس 170 جم', 'Al Alali', '170 g', 'pantry', 6.25, ''],
  ['Indomie Chicken Noodles 5 x 75g', 'إندومي نودلز بنكهة الدجاج 5 × 75 جم', 'Indomie', '5 x 75 g', 'pantry', 6.0, ''],
  ['Abu Kass Basmati Rice 5kg', 'أرز أبو كاس بسمتي 5 كجم', 'Abu Kass', '5 kg', 'pantry', 39.0, ''],
  ['Afia Sunflower Oil 1.5L', 'زيت عافية دوار الشمس 1.5 لتر', 'Afia', '1.5 L', 'pantry', 17.5, ''],
  ['Heinz Tomato Ketchup 570g', 'كاتشب هاينز 570 جم', 'Heinz', '570 g', 'pantry', 9.25, ''],
  ['Lipton Yellow Label Tea 100 Bags', 'شاي ليبتون العلامة الصفراء 100 كيس', 'Lipton', '100 bags', 'breakfast', 16.5, ''],
  ['Nescafe Gold 100g', 'نسكافيه جولد 100 جم', 'Nescafe', '100 g', 'breakfast', 32.0, 'nescafe'],
  ['Nutella 350g', 'نوتيلا 350 جم', 'Nutella', '350 g', 'breakfast', 19.5, ''],
  ["Kellogg's Corn Flakes 500g", 'كورن فليكس كيلوجز 500 جم', "Kellogg's", '500 g', 'breakfast', 16.0, ''],
  ['Quaker Oats 500g', 'شوفان كويكر 500 جم', 'Quaker', '500 g', 'breakfast', 12.0, ''],
  ['Nido Full Cream Milk Powder 900g', 'حليب نيدو بودرة كامل الدسم 900 جم', 'Nido', '900 g', 'breakfast', 39.5, ''],
  ['Cadbury Dairy Milk 37g', 'كادبوري ديري ميلك 37 جم', 'Cadbury', '37 g', 'snacks-confectionery', 3.0, ''],
  ['Doritos Nacho Cheese 180g', 'دوريتوس بنكهة جبنة الناتشو 180 جم', 'Doritos', '180 g', 'snacks-confectionery', 9.0, ''],
  ['Pringles Sour Cream & Onion 165g', 'برينجلز كريمة حامضة وبصل 165 جم', 'Pringles', '165 g', 'snacks-confectionery', 9.0, 'pringles'],
  ['Americana Green Peas 450g', 'بازلاء خضراء أمريكانا 450 جم', 'Americana', '450 g', 'frozen', 6.75, ''],
  ['Sadia Chicken Nuggets 400g', 'ناجتس دجاج ساديا 400 جم', 'Sadia', '400 g', 'frozen', 15.5, ''],
  ['Cherry Tomatoes 250g', 'طماطم كرزية 250 جم', 'Fresh', '250 g', 'fruits-veg', 6.5, ''],
  ['Baby Carrots 454g', 'جزر صغير 454 جم', 'Fresh', '454 g', 'fruits-veg', 7.0, ''],
  ['Fairy Dishwashing Liquid Lemon 1L', 'سائل جلي فيري ليمون 1 لتر', 'Fairy', '1 L', 'household', 11.5, ''],
  ['Tide Powder Detergent 2.5kg', 'مسحوق غسيل تايد 2.5 كجم', 'Tide', '2.5 kg', 'household', 32.0, ''],
  ['Clorox Original Bleach 1.89L', 'كلوركس مبيض أصلي 1.89 لتر', 'Clorox', '1.89 L', 'household', 9.5, ''],
  ['Dettol Antiseptic Liquid 500ml', 'ديتول سائل مطهر 500 مل', 'Dettol', '500 ml', 'household', 17.75, ''],
  ['Fine Facial Tissues 150 x 5', 'مناديل وجه فاين 150 × 5', 'Fine', '5 x 150', 'household', 14.0, ''],
  ['Head & Shoulders Shampoo 400ml', 'شامبو هيد آند شولدرز 400 مل', 'Head & Shoulders', '400 ml', 'personal-care', 22.5, ''],
  ['Dove Beauty Bar 4 x 100g', 'صابون دوف 4 × 100 جم', 'Dove', '4 x 100 g', 'personal-care', 15.0, ''],
  ['Colgate Total Toothpaste 100ml', 'معجون أسنان كولجيت توتال 100 مل', 'Colgate', '100 ml', 'personal-care', 9.75, ''],
  ['Pampers Baby-Dry Size 4 (44 pcs)', 'حفاضات بامبرز بيبي دراي مقاس 4 (44 حبة)', 'Pampers', '44 pcs', 'baby-care', 59.0, ''],
  ["Johnson's Baby Shampoo 500ml", 'شامبو جونسون للأطفال 500 مل', "Johnson's", '500 ml', 'baby-care', 18.5, ''],
  ['Cerelac Wheat & Milk 400g', 'سيريلاك قمح وحليب 400 جم', 'Nestlé', '400 g', 'baby-care', 16.75, ''],
  ['Whiskas Adult Tuna 1.2kg', 'ويسكاس للقطط البالغة تونة 1.2 كجم', 'Whiskas', '1.2 kg', 'pet-care', 24.0, ''],
  ['Royal Canin Kitten 400g', 'رويال كانين للقطط الصغيرة 400 جم', 'Royal Canin', '400 g', 'pet-care', 36.0, ''],
];

// Products the ERP already sent but nobody has activated yet (status 'new').
export const NEW_IN_SEED: CatalogTuple[] = [
  ['Galaxy Smooth Milk 36g', 'جالاكسي حليب ناعم 36 جم', 'Galaxy', '36 g', 'snacks-confectionery', 3.0, ''],
  ['Mars 51g', 'مارس 51 جم', 'Mars', '51 g', 'snacks-confectionery', 3.0, ''],
  ['Red Bull Energy Drink 250ml', 'مشروب طاقة ريد بول 250 مل', 'Red Bull', '250 ml', 'beverages', 7.5, ''],
];

// Products that arrive for the first time in today's ERP sample file.
export const NEW_IN_TODAYS_ERP: CatalogTuple[] = [
  ['Nivea Men Deodorant Spray 150ml', 'مزيل عرق نيفيا للرجال بخاخ 150 مل', 'Nivea', '150 ml', 'personal-care', 14.25, ''],
  ['Kraft Cheddar Cheese Slices 200g', 'شرائح جبنة شيدر كرافت 200 جم', 'Kraft', '200 g', 'dairy-eggs', 11.5, ''],
  ['Lipton Ice Tea Peach 320ml', 'ليبتون شاي مثلج بالخوخ 320 مل', 'Lipton', '320 ml', 'beverages', 3.25, ''],
  ['Barbican Pomegranate 330ml', 'باربيكان رمان 330 مل', 'Barbican', '330 ml', 'beverages', 3.5, ''],
  ['Al Rawabi Fresh Milk 2L', 'حليب الروابي طازج 2 لتر', 'Al Rawabi', '2 L', 'dairy-eggs', 12.0, ''],
  ['Pedigree Adult Chicken 3kg', 'بيديجري للكلاب البالغة دجاج 3 كجم', 'Pedigree', '3 kg', 'pet-care', 45.0, ''],
];

// Listed on marketplaces but dropped from today's ERP file (shows "missing from ERP").
export const DROPPED_IN_TODAYS_ERP = ['Rani Orange Float 240ml', 'Kiri Cream Cheese 6 Portions'];

class Product {
  url = '';
  title = '';
  description = '';
  price = 0;
  oldPrice = '';
  images = [];
  brand = '';
  category = '';
  colors = [];
  sizes = [];
  variants = [];
  completed = false;
  scraping = false;
  createdAt = null;
  updatedAt = null;

  constructor({
    url, title, description, price, oldPrice, brand, category,
    images = [], colors = [], sizes = [], variants = [], completed = false, scraping = false,
    createdAt = null, updatedAt = null,
  }) {
    if (!url) {
      throw new Error('Product must have valid URL!');
    }
    this.url = url;
    if (title) this.title = title;
    if (description) this.description = description;
    if (price && price > 0) this.price = price;
    if (oldPrice) this.oldPrice = oldPrice;
    if (brand) this.brand = brand;
    if (category) this.category = category;
    if (images.length) this.images = images;
    if (colors.length) this.colors = colors;
    if (sizes.length) this.sizes = sizes;
    if (variants.length) this.variants = variants;
    this.completed = completed;
    this.scraping = scraping;
    this.createdAt = createdAt || Date.now();
    this.updatedAt = updatedAt || Date.now();
  }

  toObject() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      price: this.price,
      oldPrice: this.oldPrice,
      images: this.images,
      brand: this.brand,
      category: this.category,
      colors: this.colors,
      sizes: this.sizes,
      variants: this.variants,
      completed: this.completed,
      scraping: this.scraping,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class Website {
  domain = ''
  title = ''
  description = ''
  image = ''
  brand = ''
  category = ''
  price = ''
  oldPrice = ''
  color = ''
  size = ''
  active = ''
  constructor({
    domain, title, description, image, brand, category, price, oldPrice, color, size, active,
  }) {
    this.domain = domain;
    this.title = title;
    this.description = description;
    this.image = image;
    this.brand = brand;
    this.category = category;
    this.price = price;
    this.oldPrice = oldPrice;
    this.color = color;
    this.size = size;
    this.active = active;
  }

  toObject() {
    return {
      domain: this.domain,
      title: this.title,
      description: this.description,
      image: this.image,
      brand: this.brand,
      category: this.category,
      price: this.price,
      oldPrice: this.oldPrice,
      color: this.color,
      size: this.size,
      active: this.active,
    };
  }
}
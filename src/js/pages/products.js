var _products = [];
var _dataTable;

$(function() {
  console.log('[Script][Loaded] websites.js');

  $('#add-item').on('click', onClickAddButton);

  $('#website-form').on('submit', function(e) {
    e.preventDefault();

    const formData = validateForm();

    if (!formData) return false;

    const index = _products.map(prod => prod.url).indexOf(formData.url);
    // check duplicate profile.
    const id = Number($('#product-id').val());
    if (id === -1 && index > -1) {
      toastr.error('URL already exists in product list!');
      return;
    }

    if (!confirm('Are you sure to submit?')) return false;
    

    return loadProducts().then((products) => {
      const product = {
        createdAt: Date.now(),
        ...(products[id] || {}),
        ...formData,
        updatedAt: Date.now(),
      };
      if (id > -1) {
        products[id] = product;
      } else {
        products.push(product);  
      }
      return storeProducts(products);
    })
    .then((products) => {
      _products = products;
      emptyForm();
      loadDataAndRedraw();
      toastr.success('Data saved successfully!');
    })
    .catch((error) => {
      console.log('[Submit][Error]', error);
      toastr.error(error.message);
    })
  });

  $('#tableWithDynamicRows').on('click', '.edit-row', function() {
    onEdit($(this).data('url'));
  });

  $('#tableWithDynamicRows').on('click', '.delete-row', function() {
    onDelete($(this).data('url'));
  });

  loadDataAndShow();
});

function loadDataAndShow() {
  loadProducts().then((products) => {
    _products = products;
    const rowsHTML = products.map((product, i) => `<tr>
      <td>${i + 1}</td>
      <td>${product.url}</td>
      <td>${product.title}</td>
      <td>${product.description}</td>
      <td>${product.brand}</td>
      <td>${product.category}</td>
      <td>${product.images}</td>
      <td>${product.createdAt}</td>
      <td>${product.updatedAt}</td>
      <td>${!!product.scraping}</td>
      <td>${product.completed}</td>
      <td>${product.url}</td>
    </tr>`);
    $('#tableWithDynamicRows tbody').html(rowsHTML);
    initDataTable();
  });
}

function loadDataAndRedraw() {
  loadProducts().then((products) => {
    _products = products;
    const rowsHTML = products.map((product, i) => `<tr>
      <td>${i + 1}</td>
      <td>${product.url}</td>
      <td>${product.title}</td>
      <td>${product.description}</td>
      <td>${product.brand}</td>
      <td>${product.category}</td>
      <td>${product.images}</td>
      <td>${product.createdAt || Date.now()}</td>
      <td>${product.updatedAt || Date.now()}</td>
      <td>${product.scraping || false}</td>
      <td>${product.completed || false}</td>
      <td>${product.url}</td>
    </tr>`);
    _dataTable.fnClearTable();
    const data = products.forEach((product, i) => _dataTable._fnAddData([
      i + 1,
      product.url,
      product.title,
      product.description,
      product.brand,
      product.category,
      product.images,
      product.createdAt,
      product.updatedAt,
      product.scraping,
      product.completed,
      product.url,
    ]));
    
    // _dataTable._fnAddData(data);
    // $('#tableWithDynamicRows tbody').html(rowsHTML);
    _dataTable.fnDraw();
  });
}

function initDataTable() {
  // Initialize datatable with ability to add rows dynamically
  var initTableWithDynamicRows = function () {
      _dataTable = $('#tableWithDynamicRows');

      var settings = {
          responsive: true,
          //== DOM Layout settings
          // dom: `<'row'<'col-sm-12'tr>>
          // <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 dataTables_pager'lp>>`,

          lengthMenu: [5, 10, 25, 50],

          pageLength: 10,

          language: {
              'lengthMenu': 'Display _MENU_',
          },
          order: [
              [0, "asc"]
          ],
          searching: true,

          processing: true,

          paginate: true,

          columnDefs: [
            {
              targets: -1,
              label: 'Actions',
              orderable: false,
              render: function (data, type, full, meta) {
                return `
                  <span class="edit-row m-portlet__nav-link btn m-btn m-btn--hover-brand m-btn--icon m-btn--icon-only m-btn--pill" title="Edit"
                    data-url="${data}">
                    <i class="la la-edit"></i>
                  </span>
                  <span href="#" class="delete-row m-portlet__nav-link btn m-btn m-btn--hover-brand m-btn--icon m-btn--icon-only m-btn--pill" title="Remove"
                    data-url="${data}">
                    <i class="la la-trash"></i>
                  </span>
                `;
              },
            },
            {
              targets: -2,
              label: 'Status',
              render: function (data, type, full, meta) {
                  const status = {
                      'false': {'title': 'Inactive', 'class': 'm-badge--warning'},
                      'true': {'title': 'Active', 'class': 'm-badge--success'},
                  };
                  data = data.toString();
                  if (typeof status[data] === 'undefined') {
                      return data;
                  }
                  return '<span class="m-badge ' + status[data].class + ' m-badge--wide">' + status[data].title + '</span>';
              },
            },
            {
              targets: -3,
              label: 'Scraping',
              render: function (data, type, full, meta) {
                const status = {
                  'false': { 'title': 'Waiting', 'class': 'm-badge--success' },
                  'true': { 'title': 'Yes', 'class': 'm-badge--danger' },
                };
                if (typeof status[data] === 'undefined') {
                  return data;
                }
                return '<span class="m-badge ' + status[data].class + ' m-badge--wide">' + status[data].title + '</span>';
              },
            },
            {
              targets: -4,
              label: 'Updated At',
              render: function (data, type, full, meta) {
                data = parseInt(data, 10);
                let dt = new Date(data);
                return dt.toLocaleString();
              },
            },
            {
              targets: -5,
              label: 'Created At',
              render: function (data, type, full, meta) {
                data = parseInt(data, 10);
                let dt = new Date(data);
                return dt.toLocaleString();
              },
            },
            {
              targets: 1,
              label: "URL",
              render: function (data, type, full, meta) {
                return `<a href="${data}" target="_blank">${shortenURL(data)}</a>`;
              },
            },
          ]
      };

      _dataTable.dataTable(settings);
  }
  initTableWithDynamicRows();
}

function loadProducts() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(["products", "websites1"], function (store = {}) {
        resolve(store.products || []);      
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storeProducts(products) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ products: products });
      resolve(products);
    } catch (e) {
      reject(e);
    }
  });
}

function onEdit(url) {
  let product, index;
  _products.forEach((prd, i) => {
    if (prd.url === url) {
      product = prd;
      index = i;
    }
  });

  $('#product-id').val(index);

  $('#url').val(product.url);
  $('#title').val(product.title);
  $('#description').val(product.description);
  $('#images').val(product.images);
  $('#brand').val(product.brand);
  $('#category').val(product.category);
  $('#price').val(product.price);
  $('#oldPrice').val(product.oldPrice);
  $('#colors').val(product.colors);
  $('#sizes').val(product.sizes);
  $('#completed').attr('checked', !!product.completed);
  $('#scraping').attr('checked', !!product.scraping);

  $('#website-form button[type="submit"]').html('<i class="la la-save"></i>Update');
  $('#form-wrapper').removeClass('_hide').addClass('_show');
}

function onDelete(url) {
  if (!confirm('Are you sure to delete this product?')) return false;

  const index = _products.map((product) => product.url).indexOf(url);
  _products.splice(index, 1);
  return storeProducts(_products).then((products) => {
    loadDataAndRedraw();
    toastr.success('A product has been deleted!');
  })
  .catch((error) => {
    console.log('[onDelete][Error]', error);
    toastr.error(error.message);
  });
}

function onClickAddButton() {
  const isEditing = Number($('#product-id').val()) > -1;
  const opened = $('#form-wrapper').hasClass('_show');
  emptyForm();
  if (opened && !isEditing) {
    $('#form-wrapper').addClass('_hide').removeClass('_show');
  } else {
    $('#form-wrapper').removeClass('_hide').addClass('_show');
  }
}

function validateForm() {
  const url = $('#url').val();
  const completed = $('#completed').is(':checked');
  const title = $('#title').val();
  const description = $('#description').val();
  const brand = $('#brand').val();
  const category = $('#category').val();
  const images = $('#images').val();
  const price = $('#price').val();
  const oldPrice = $('#oldPrice').val();
  const colors = $('#colors').val();
  const sizes = $('#sizes').val();
  const scraping = $('#scraping').is(':checked');

  if (!url.trim()) {
    toastr.warning('URL is required!', 'Validation');
    return true;
  }
  return {
    url, completed, title, description, brand, category, images, price, oldPrice, colors, sizes, scraping,
  };
}

function emptyForm() {
  $('#website-form').find("input[type=text], input[type=hidden], textarea").val("");
  $('#product-id').val("-1");
  $('#website-form button[type="submit"]').html('<i class="la la-plus"></i>Add');
  $('#form-wrapper').addClass('_hide').removeClass('_show');
}



// Utilities

function shortenURL(url, length = 60) {
  if (url.length <= 60) return url;
  const half_len = Math.floor(length / 2);
  return url.substring(0, half_len) + '...' + url.substring(url.length - 1 - half_len, url.length - 1);
}



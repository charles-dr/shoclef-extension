var _websites = [];
var _dataTable;

$(function() {
  console.log('[Script][Loaded] websites.js');

  $('#add-item').on('click', onClickAddButton);

  $('#website-form').on('submit', function(e) {
    e.preventDefault();
    if (!confirm('Are you sure to submit?')) return false;
    const formData = {
      domain: $('#domain').val(),
      title: $('#title').val(),
      description: $('#description').val(),
      image: $('#image').val(),
      brand: $('#brand').val(),
      category: $("#category").val(),
      price: $('#price').val(),
      oldPrice: $('#oldPrice').val(),
      color: $('#color').val(),
      size: $('#size').val(),
      active: $('#active').is(':checked'),
    };
    return loadSiteProfiles().then((profiles) => {
      // check duplicate profile.
      const id = Number($('#site-id').val());
      // const [duplicated] = profiles.filter((profile) => websiteProfile.domain === profile.domain);
      // if (duplicated) throw new Error(`Domain "${websiteProfile.domain}" already exists!`);
      
      const websiteProfile = {
        createdAt: Date.now(),
        ...(_websites[id] || {}),
        ...formData,
        updatedAt: Date.now(),
      };
      if (id > -1) {
        profiles[id] = websiteProfile;
      } else {
        profiles.push(websiteProfile);  
      }
      return storeSiteProfiles(profiles);
    })
    .then((profiles) => {
      _websites = profiles;
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
    onEdit($(this).data('domain'));
  });

  $('#tableWithDynamicRows').on('click', '.delete-row', function() {
    onDelete($(this).data('domain'));
  });

  loadDataAndShow();
});

function loadDataAndShow() {
  loadSiteProfiles().then((profiles) => {
    _websites = profiles;
    const rowsHTML = profiles.map((profile, i) => `<tr>
      <td>${i + 1}</td>
      <td>${profile.domain}</td>
      <td>${profile.createdAt || Date.now()}</td>
      <td>${profile.updatedAt || Date.now()}</td>
      <td>${profile.active || true}</td>
      <td>${profile.domain}</td>
    </tr>`);
    $('#tableWithDynamicRows tbody').html(rowsHTML);
    initDataTable();
  });
}

function loadDataAndRedraw() {
  loadSiteProfiles().then((profiles) => {
    _websites = profiles;
    const rowsHTML = profiles.map((profile, i) => `<tr>
      <td>${i + 1}</td>
      <td>${profile.domain}</td>
      <td>${profile.createdAt || Date.now()}</td>
      <td>${profile.updatedAt || Date.now()}</td>
      <td>${profile.active || true}</td>
      <td>${profile.domain}</td>
    </tr>`);
    _dataTable.fnClearTable();
    const data = profiles.forEach((profile, i) => _dataTable._fnAddData([i + 1, profile.domain, profile.createdAt, profile.updatedAt, profile.active, profile.domain]));
    
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
              orderable: false,
              render: function (data, type, full, meta) {
                return `
                  <span class="edit-row m-portlet__nav-link btn m-btn m-btn--hover-brand m-btn--icon m-btn--icon-only m-btn--pill" title="Edit"
                    data-domain="${data}">
                    <i class="la la-edit"></i>
                  </span>
                  <span href="#" class="delete-row m-portlet__nav-link btn m-btn m-btn--hover-brand m-btn--icon m-btn--icon-only m-btn--pill" title="Remove"
                    data-domain="${data}">
                    <i class="la la-trash"></i>
                  </span>
                `;
              },
            },
            {
              targets: -2,
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
              render: function (data, type, full, meta) {
                data = parseInt(data, 10);
                let dt = new Date(data);
                return dt.toLocaleString();
              },
            },
            {
              targets: -4,
              render: function (data, type, full, meta) {
                data = parseInt(data, 10);
                let dt = new Date(data);
                return dt.toLocaleString();
              },
            },
            // {
            //   targets: 1,
            //   render: function (data, type, full, meta) {
            //     return `<a href="${data}">${data}</a>`;
            //   },
            // },
          ]
      };

      _dataTable.dataTable(settings);
  }
  initTableWithDynamicRows();
}

function loadSiteProfiles() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(["websites", "websites1"], function (store = {}) {
        resolve(store.websites || []);      
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storeSiteProfiles(profiles) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ websites: profiles });
      resolve(profiles);
    } catch (e) {
      reject(e);
    }
  });
}

function onEdit(domain) {
  let site, index;
  _websites.forEach((s, i) => {
    if (s.domain === domain) {
      site = s;
      index = i;
    }
  });

  $('#site-id').val(index);

  $('#domain').val(site.domain);
  $('#title').val(site.title);
  $('#description').val(site.description);
  $('#image').val(site.image);
  $('#brand').val(site.brand);
  $('#category').val(site.category);
  $('#price').val(site.price);
  $('#oldPrice').val(site.oldPrice);
  $('#color').val(site.color);
  $('#size').val(site.size);
  $('#active').attr('checked', !!site.active);

  $('#website-form button[type="submit"]').html('<i class="la la-save"></i>Update');
  $('#form-wrapper').removeClass('_hide').addClass('_show');
}

function onDelete(domain) {
  if (!confirm('Are you sure to delete this website profile?')) return false;
  const index = _websites.map((site) => site.domain).indexOf(domain);
  _websites.splice(index, 1);
  return storeSiteProfiles(_websites).then((profiles) => {
    loadDataAndRedraw();
    toastr.success('A website has been deleted!');
  })
  .catch((error) => {
    console.log('[onDelete][Error]', error);
    toastr.error(error.message);
  });
}

function onClickAddButton() {
  const isEditing = Number($('#site-id').val()) > -1;
  const opened = $('#form-wrapper').hasClass('_show');
  emptyForm();
  if (opened && !isEditing) {
    $('#form-wrapper').addClass('_hide').removeClass('_show');
  } else {
    $('#form-wrapper').removeClass('_hide').addClass('_show');
  }
}

function emptyForm() {
  $('#website-form').find("input[type=text], input[type=hidden], textarea").val("");
  $('#site-id').val("-1");
  $('#website-form button[type="submit"]').html('<i class="la la-plus"></i>Add');
  $('#form-wrapper').addClass('_hide').removeClass('_show');
}



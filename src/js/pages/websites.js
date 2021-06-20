var _websites = [];
$(function() {
  console.log('[Script][Loaded] websites.js');

  $('#website-form').on('submit', function(e) {
    e.preventDefault();
    if (!confirm('Are you sure to submit?')) return false;
    const websiteProfile = {
      domain: $('#domain').val(),
      title: $('#title').val(),
      description: $('#description').val(),
      image: $('#image').val(),
      brand: $('#brand').val(),
    };
    return loadSiteProfiles().then((profiles) => {
      console.log('[Websites] loaded', profiles);
      // check duplicate profile.
      const [duplicated] = profiles.filter((profile) => websiteProfile.domain === profile.domain);
      if (duplicated) throw new Error(`Domain "${websiteProfile.domain}" already exists!`);
      profiles.push(websiteProfile);
      return storeSiteProfiles(profiles);
    })
    .then((stored) => {
      toastr.success('Data saved successfully!');
    })
    .catch((error) => {
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

function initDataTable() {
  // Initialize datatable with ability to add rows dynamically
  var initTableWithDynamicRows = function () {
      var _dataTable = $('#tableWithDynamicRows');

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
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

function onEdit(domain) {
  const [site] = _websites.filter((site) => site.domain === domain);

  $('#domain').val(site.domain);
  $('#title').val(site.title);
  $('#description').val(site.description);
  $('#image').val(site.image);
  $('#brand').val(site.brand);
  $('#active').attr('checked', !!site.active);
}

function onDelete(domain) {
  const [site] = _websites.filter((site) => site.domain === domain);
  console.log('[Site]', site);
}



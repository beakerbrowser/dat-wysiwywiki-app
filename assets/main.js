var isEditing = false
var self = new DatArchive(location)

$(document).ready(function () {
  // wire up handlers
  $('.action-fork').on('click', onFork)
  $('.action-save').on('click', onSave)
  $('.action-cancel').on('click', onCancel)

  // enable edit if editable
  self.getInfo().then(info => {
    if (info.isOwner) {
      $('.action-edit').removeClass('hidden')
      $('.action-edit').on('click', onEdit)
      $('.action-publish').on('click', onPublish)
    } else {
      $('.action-fork').addClass('btn-success')
    }
  })
  updateNav()
})

function onFork (e) {
  e.preventDefault()
  DatArchive.resolveName(location.toString()).then(url => {
    return DatArchive.fork(url, {prompt: true})
  }).then(fork => {
    window.location = fork.url
  })
}

function onEdit () {
  // update UI
  isEditing = true
  updateNav()
  $('main').summernote({
    toolbar: [
      ['style', ['style']],
      ['styles', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
      ['font', ['fontname', 'fontsize', 'color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['table', ['table']],
      ['insert', ['link', 'hr', 'picture', 'video']],
      ['view', ['codeview', 'help']]
    ],
    callbacks: {onImageUpload}
  })
  $('main').summernote('fullscreen.toggle')
}

function onImageUpload (files) {
  $.each(files, (idx, file) => {
    var reader = new FileReader()
    reader.onload = async () => {
      // make sure /images exists
      try { await self.mkdir('/images') }
      catch (e) {}
      // write
      const path = `/images/${file.name}`
      await self.writeFile(path, reader.result, 'binary')
      // insert
      const url = self.url + path
      $('main').summernote('insertImage', url, file.name)
    }
    reader.readAsArrayBuffer(file)
  })
}

function onSave () {
  // update UI
  isEditing = false
  updateNav()
  $('main').summernote('fullscreen.toggle')
  $('main').summernote('destroy')

  // persist changes
  var doc = `<!DOCTYPE html>${document.documentElement.outerHTML}`
  self.writeFile('/index.html', doc, 'utf8').then(updateNav)
}

function onCancel () {
  // revert changes
  $('main').summernote('reset')  

  // update UI
  isEditing = false
  updateNav()
  $('main').summernote('fullscreen.toggle')
  $('main').summernote('destroy')  
}

function onPublish () {
  self.commit().then(updateNav)
}

function updateNav () {
  // read / edit mode
  if (isEditing) {
    $('.readmode').removeClass('active')
    $('.editmode').addClass('active')
  } else {
    $('.readmode').addClass('active')
    $('.editmode').removeClass('active')
  }

  // changes?
  self.diff().then(changes => {
    if (changes.length) {
      $('.action-publish').removeClass('hidden')
    } else {
      $('.action-publish').addClass('hidden')
    }
  })
}
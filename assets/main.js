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
    return DatArchive.fork(url)
  }).then(fork => {
    window.location = fork.url
  })
}

function onEdit () {
  // update UI
  isEditing = true
  updateNav()
  $('main').summernote()
  $('main').summernote('fullscreen.toggle')
}

function onSave () {
  // update UI
  isEditing = false
  updateNav()
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
# Extension for tiktok

## ID

 - jningldoceginiadkmcdgiknfokgpiia

## TikTok Element classes
- webcast-chatroom
  webcast-chatroom-header
    webcast-chatroom-header-person
      webcast-chatroom-header-person-number

- webcast-chatroom-messages
  webcast-chatroom-messages-list is-not-lock
    webcast-chatroom-message-item webcast-chatroom__room-message(webcast-chatroom__social-message, webcast-chatroom__like-message, webcast-chatroom__member-message) webcast-chatroom__room
    ---------
      badge-wrap
        message-icon-wrapper?

        badge-image?
          <img />
      content
    ----------
      webcast-chatroom__profile_wrapper
        badge-wrap
          badge-image
            img!
      chat-message-item
        webcast-chatroom__profile_wrapper
          nickname
        colon
        content



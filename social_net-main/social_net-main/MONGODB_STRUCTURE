# 🗄️ MongoDB Database Documentation

This document explains the data architecture of the Social Media Platform, providing real-world JSON examples for each collection.

---

### 👤 Users Collection (`users`)
Stores user profiles, credentials, and settings.

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d11",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "$2b$10$hashed_password_here...",
  "handle": "@johndoe0d11",
  "fullName": "John Doe",
  "bio": "Full-stack developer | Love coding and coffee ☕",
  "location": "Casablanca, Morocco",
  "interests": ["Technology", "Coding", "Gaming"],
  "isPrivate": false,
  "avatar": {
    "url": "http://minio:9000/avatars/user-123.jpg",
    "key": "avatars/user-123.jpg"
  },
  "followersCount": 120,
  "followingCount": 85,
  "bookmarks": ["651a2b3c4d5e6f7a8b9c0d22"],
  "createdAt": "2024-01-19T10:00:00.000Z",
  "updatedAt": "2024-01-19T12:30:00.000Z"
}
```

---

### 📝 Threads Collection (`threads`)
Stores all posts, including standalone posts, reposts, and quotes.

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d22",
  "author": "651a2b3c4d5e6f7a8b9c0d11",
  "content": "Just launched my new project! Check it out #coding #webdev",
  "hashtags": ["coding", "webdev"],
  "media": {
    "mediaType": "image",
    "url": "http://minio:9000/threads/post-99.png",
    "key": "threads/post-99.png",
    "contentType": "image/png"
  },
  "repostOf": null,
  "quoteOf": null,
  "isArchived": false,
  "createdAt": "2024-01-19T11:00:00.000Z"
}
```

---

### 💬 Comments Collection (`comments`)
Stores replies to threads and nested comment replies.

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d33",
  "author": "651a2b3c4d5e6f7a8b9c0def",
  "thread": "651a2b3c4d5e6f7a8b9c0d22",
  "content": "Wow, this looks amazing! How long did it take?",
  "parentComment": null,
  "likesCount": 5,
  "createdAt": "2024-01-19T11:15:00.000Z"
}
```

---

### ❤️ Likes Collection (`likes`)
Tracks who liked what (Threads or Comments).

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d44",
  "user": "651a2b3c4d5e6f7a8b9c0d11",
  "thread": "651a2b3c4d5e6f7a8b9c0d22",
  "comment": null,
  "createdAt": "2024-01-19T11:20:00.000Z"
}
```

---

### 🤝 Followers Collection (`follows`)
Manages relationships and follow requests.

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d55",
  "follower": "651a2b3c4d5e6f7a8b9c0def",
  "following": "651a2b3c4d5e6f7a8b9c0d11",
  "status": "ACCEPTED",
  "createdAt": "2024-01-19T09:00:00.000Z"
}
```

---

### 🔔 Notifications Collection (`notifications`)
Stores alerts for the user's activity.

**Real Example:**
```json
{
  "_id": "651a2b3c4d5e6f7a8b9c0d66",
  "type": "LIKE",
  "receiver": "651a2b3c4d5e6f7a8b9c0d11",
  "sender": "651a2b3c4d5e6f7a8b9c0def",
  "thread": "651a2b3c4d5e6f7a8b9c0d22",
  "comment": null,
  "isRead": false,
  "createdAt": "2024-01-19T11:20:05.000Z"
}
```

---

### 🔗 Relationship Map
- **Author → User**: `thread.author` links to `user._id`
- **Reply → Thread**: `thread.parentThread` links to `thread._id`
- **Comment → Thread**: `comment.thread` links to `thread._id`
- **Like → Thread/Comment**: `like.thread` or `like.comment` links to their respective IDs.
- **Notification → User**: `notification.receiver` and `notification.sender` link to `user._id`

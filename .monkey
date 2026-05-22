{
  "target": "blog.my-monkey.fr",
  "source": "./dist/",
  "setup": {
    "spa_routing": false
  },
  "post_deploy": "curl -sS -X POST 'https://api.indexnow.org/IndexNow' -H 'Content-Type: application/json' -d '{\"host\":\"blog.my-monkey.fr\",\"key\":\"aae48707172349adb1ecff4f015f17a8\",\"keyLocation\":\"https://blog.my-monkey.fr/aae48707172349adb1ecff4f015f17a8.txt\",\"urlList\":[\"https://blog.my-monkey.fr/\",\"https://blog.my-monkey.fr/rss.xml\",\"https://blog.my-monkey.fr/sitemap-index.xml\"]}' || true",
  "site": {
    "title": "Blog My-Monkey",
    "description": "Blog My-Monkey — carnet de bord d'une galaxie d'une trentaine de projets perso : updates, post-mortems et défis techniques en continu.",
    "image": "/og-default.png",
    "category": "blog"
  }
}

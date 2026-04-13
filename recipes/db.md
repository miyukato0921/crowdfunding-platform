# DB操作テンプレート集

テーブル名・カラム名を差し替えるだけで使えるテンプレートです。
`@neondatabase/serverless` の `sql` タグを使っています。

---

## SELECT — 1件取得（条件一致）

```ts
const rows = await sql`
  SELECT id, カラム1, カラム2
  FROM テーブル名
  WHERE 検索カラム = ${検索値}
  LIMIT 1
`
const row = rows[0] // 見つからなければ undefined
```

**差し替え箇所**
- `カラム1, カラム2` → 取得したい列名
- `テーブル名` → 対象のテーブル
- `検索カラム` → 絞り込みに使う列（例: `email`, `id`）
- `${検索値}` → 実際の値を入れる変数

**実例（このプロジェクト）**
```ts
const users = await sql`
  SELECT id, email, password_hash
  FROM admin_users
  WHERE email = ${username}
  LIMIT 1
`
```

---

## SELECT — JOIN（2テーブルを結合して取得）

```ts
const rows = await sql`
  SELECT a.id, a.カラム1, b.カラム2
  FROM テーブルA a
  JOIN テーブルB b ON b.id = a.テーブルB_id
  WHERE a.検索カラム = ${検索値}
  LIMIT 1
`
```

**差し替え箇所**
- `テーブルA`, `テーブルB` → 結合する2つのテーブル
- `a.テーブルB_id` → テーブルAがテーブルBを参照している外部キー列
- `a.カラム1`, `b.カラム2` → それぞれのテーブルから取得したい列

**実例（このプロジェクト）**
```ts
const result = await sql`
  SELECT au.id, au.email, au.name, au.role, au.created_at
  FROM admin_sessions s
  JOIN admin_users au ON au.id = s.admin_user_id
  WHERE s.token = ${token} AND s.expires_at > NOW()
  LIMIT 1
`
```

---

## INSERT — 新規登録

```ts
await sql`
  INSERT INTO テーブル名 (カラム1, カラム2, カラム3)
  VALUES (${値1}, ${値2}, ${値3})
`
```

**差し替え箇所**
- `テーブル名` → 挿入先のテーブル
- `カラム1, カラム2, カラム3` → 値をセットしたい列名
- `${値1}, ${値2}, ${値3}` → 実際の値を入れる変数

**実例（このプロジェクト）**
```ts
await sql`
  INSERT INTO admin_sessions (admin_user_id, token, expires_at)
  VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
`
```

---

## UPSERT — 登録（重複したら更新）

```ts
await sql`
  INSERT INTO テーブル名 (カラム1, カラム2)
  VALUES (${値1}, ${値2})
  ON CONFLICT (重複チェックするカラム) DO UPDATE SET
    カラム2 = ${値2}
`
```

**差し替え箇所**
- `テーブル名` → 対象のテーブル
- `重複チェックするカラム` → ここが重複したらUPDATEに切り替える列（通常はUNIQUE制約のある列）
- `DO UPDATE SET カラム2 = ${値2}` → 重複時に上書きしたい列と値

**実例（このプロジェクト）**
```ts
await sql`
  INSERT INTO admin_users (email, password_hash, name, role)
  VALUES (${email}, ${hash}, '管理者', 'super_admin')
  ON CONFLICT (email) DO UPDATE SET
    password_hash = ${hash}
`
```

---

## DELETE — 条件一致した行を削除

```ts
await sql`
  DELETE FROM テーブル名
  WHERE 検索カラム = ${検索値}
`
```

**差し替え箇所**
- `テーブル名` → 対象のテーブル
- `検索カラム` → 削除条件に使う列
- `${検索値}` → 実際の値を入れる変数

**実例（このプロジェクト）**
```ts
await sql`
  DELETE FROM admin_sessions
  WHERE token = ${token}
`
```

---

## まとめ

| 操作 | 用途 |
|------|------|
| SELECT | データを取得する |
| SELECT + JOIN | 2つのテーブルを結合して取得する |
| INSERT | 新しいデータを追加する |
| UPSERT | あれば更新・なければ追加する |
| DELETE | データを削除する |

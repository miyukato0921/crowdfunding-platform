"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"
import { Check, Save, CreditCard, Mail, Globe, Eye, EyeOff, FlaskConical, Zap, QrCode } from "lucide-react"
import Image from "next/image"

interface Props {
  initial: Record<string, string>
}

const MASKED = "••••••••••••••••"

function SecretField({
  id,
  label,
  placeholder,
  saved,
  value,
  onChange,
  show,
  onToggleShow,
  editing,
  onEdit,
}: {
  id: string
  label: string
  placeholder: string
  saved: boolean
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  editing: boolean
  onEdit: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {saved && <span className="ml-2 text-xs text-ireland-green font-normal">設定済み</span>}
        </Label>
        {saved && !editing && (
          <button type="button" onClick={onEdit} className="text-xs text-ireland-green underline underline-offset-2">
            変更する
          </button>
        )}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={saved && !editing}
          placeholder={placeholder}
          className={`pr-10 font-mono text-sm ${saved && !editing ? "bg-muted cursor-default select-none" : ""}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function SiteSettingsForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // サイト情報
  const [title, setTitle] = useState(initial.site_title ?? "")
  const [subtitle, setSubtitle] = useState(initial.site_subtitle ?? "")
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "")

  // Stripe モード
  const [stripeMode, setStripeMode] = useState<"test" | "live">(
    (initial.stripe_mode as "test" | "live") ?? "live"
  )

  // Stripe 本番キー
  const stripeKeySaved = !!initial.stripe_secret_key
  const [stripeKey, setStripeKey] = useState(stripeKeySaved ? MASKED : "")
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [stripeKeyEditing, setStripeKeyEditing] = useState(false)

  const stripePubKeySaved = !!initial.stripe_publishable_key
  const [stripePubKey, setStripePubKey] = useState(initial.stripe_publishable_key ?? "")

  const stripeWebhookSaved = !!initial.stripe_webhook_secret
  const [stripeWebhook, setStripeWebhook] = useState(stripeWebhookSaved ? MASKED : "")
  const [showStripeWebhook, setShowStripeWebhook] = useState(false)
  const [stripeWebhookEditing, setStripeWebhookEditing] = useState(false)

  // Stripe テストキー
  const stripeTestKeySaved = !!initial.stripe_test_secret_key
  const [stripeTestKey, setStripeTestKey] = useState(stripeTestKeySaved ? MASKED : "")
  const [showStripeTestKey, setShowStripeTestKey] = useState(false)
  const [stripeTestKeyEditing, setStripeTestKeyEditing] = useState(false)

  const stripeTestPubKeySaved = !!initial.stripe_test_publishable_key
  const [stripeTestPubKey, setStripeTestPubKey] = useState(initial.stripe_test_publishable_key ?? "")

  const stripeTestWebhookSaved = !!initial.stripe_test_webhook_secret
  const [stripeTestWebhook, setStripeTestWebhook] = useState(stripeTestWebhookSaved ? MASKED : "")
  const [showStripeTestWebhook, setShowStripeTestWebhook] = useState(false)
  const [stripeTestWebhookEditing, setStripeTestWebhookEditing] = useState(false)

  // SMTP
  const smtpHostSaved = !!initial.smtp_host
  const [smtpHost, setSmtpHost] = useState(initial.smtp_host ?? "")
  const [smtpPort, setSmtpPort] = useState(initial.smtp_port ?? "587")
  const [smtpUser, setSmtpUser] = useState(initial.smtp_user ?? "")

  const smtpPassSaved = !!initial.smtp_pass
  const [smtpPass, setSmtpPass] = useState(smtpPassSaved ? MASKED : "")
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [smtpPassEditing, setSmtpPassEditing] = useState(false)

  const [emailFrom, setEmailFrom] = useState(initial.email_from ?? "greenirelandfes@iris-corp.co.jp")

  // 完了画面QRコード・リンク
  const [successQrUrl, setSuccessQrUrl] = useState(initial.success_qr_url ?? "")
  const [successQrLabel, setSuccessQrLabel] = useState(initial.success_qr_label ?? "")
  const [successLinkUrl, setSuccessLinkUrl] = useState(initial.success_link_url ?? "")
  const [successLinkLabel, setSuccessLinkLabel] = useState(initial.success_link_label ?? "")
  const [successRedirectSeconds, setSuccessRedirectSeconds] = useState(initial.success_redirect_seconds ?? "")
  const [successMessage, setSuccessMessage] = useState(initial.success_message ?? "")

  const handleSave = () => {
    startTransition(async () => {
      const payload: Record<string, string> = {
        site_title: title,
        site_subtitle: subtitle,
        logo_url: logoUrl,
        stripe_mode: stripeMode,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        email_from: emailFrom,
        stripe_publishable_key: stripePubKey,
        stripe_test_publishable_key: stripeTestPubKey,
        success_qr_url: successQrUrl,
        success_qr_label: successQrLabel,
        success_link_url: successLinkUrl,
        success_link_label: successLinkLabel,
        success_redirect_seconds: successRedirectSeconds,
        success_message: successMessage,
      }
      // masked・空欄は上書きしない
      if (stripeKey && stripeKey !== MASKED) payload.stripe_secret_key = stripeKey
      if (stripeWebhook && stripeWebhook !== MASKED) payload.stripe_webhook_secret = stripeWebhook
      if (stripeTestKey && stripeTestKey !== MASKED) payload.stripe_test_secret_key = stripeTestKey
      if (stripeTestWebhook && stripeTestWebhook !== MASKED) payload.stripe_test_webhook_secret = stripeTestWebhook
      if (smtpPass && smtpPass !== MASKED) payload.smtp_pass = smtpPass

      await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      setSaved(true)
      if (stripeKey && stripeKey !== MASKED) { setStripeKey(MASKED); setStripeKeyEditing(false) }
      if (stripeWebhook && stripeWebhook !== MASKED) { setStripeWebhook(MASKED); setStripeWebhookEditing(false) }
      if (stripeTestKey && stripeTestKey !== MASKED) { setStripeTestKey(MASKED); setStripeTestKeyEditing(false) }
      if (stripeTestWebhook && stripeTestWebhook !== MASKED) { setStripeTestWebhook(MASKED); setStripeTestWebhookEditing(false) }
      if (smtpPass && smtpPass !== MASKED) { setSmtpPass(MASKED); setSmtpPassEditing(false) }
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ロゴ */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">ロゴ画像</h2>
        </div>
        {logoUrl && (
          <div className="relative w-32 h-16 rounded-xl overflow-hidden border border-border bg-muted">
            <Image src={logoUrl} alt="ロゴプレビュー" fill className="object-contain p-2" unoptimized />
          </div>
        )}
        <ImageUploader
          name="logo_url"
          label="ロゴ画像をアップロード"
          defaultValue={logoUrl}
          onUrlChange={setLogoUrl}
        />
        <p className="text-xs text-muted-foreground">推奨サイズ: 横長・透過PNG（例: 400×100px）</p>
      </div>

      {/* サイト名・サブタイトル */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">サイト名・サブタイトル</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_title">サイトタイトル</Label>
          <Input
            id="site_title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Green Ireland Festival"
          />
          <p className="text-xs text-muted-foreground">ブラウザタブ・ヘッダーに表示されます</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_subtitle">サブタイトル / キャッチコピー</Label>
          <Textarea
            id="site_subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="日本×アイルランドの文化融合フェスティバル"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">ヘッダーやOGPに表示されます</p>
        </div>
      </div>

      {/* Stripe 決済設定 */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">Stripe 決済設定</h2>
        </div>

        {/* モードトグル */}
        <div className="space-y-2">
          <Label>決済モード</Label>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setStripeMode("test")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                stripeMode === "test"
                  ? "bg-amber-500 text-white"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              テストモード
            </button>
            <button
              type="button"
              onClick={() => setStripeMode("live")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                stripeMode === "live"
                  ? "bg-ireland-green text-white"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Zap className="w-4 h-4" />
              本番モード
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {stripeMode === "test"
              ? "テストモード中はテスト用カード番号（4242 4242 4242 4242）で決済できます。実際の課金は発生しません。"
              : "本番モードで実際の決済が行われます。本番用キーが設定されていることを確認してください。"}
          </p>
          {stripeMode === "test" && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">テストモード有効中</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">実際の課金は発生しません。テスト用キーを使用しています。</p>
            </div>
          )}
        </div>

        {/* テストキー */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">テスト用キー</h3>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono">sk_test_ / pk_test_</span>
          </div>
          <SecretField
            id="stripe_test_secret_key"
            label="テスト シークレットキー"
            placeholder="sk_test_xxxxxxxxxxxx"
            saved={stripeTestKeySaved}
            value={stripeTestKey}
            onChange={setStripeTestKey}
            show={showStripeTestKey}
            onToggleShow={() => setShowStripeTestKey((v) => !v)}
            editing={stripeTestKeyEditing}
            onEdit={() => { setStripeTestKey(""); setStripeTestKeyEditing(true) }}
          />
          <div className="space-y-2">
            <Label htmlFor="stripe_test_publishable_key">
              テスト 公開キー
              {stripeTestPubKeySaved && <span className="ml-2 text-xs text-ireland-green font-normal">設定済み</span>}
            </Label>
            <Input
              id="stripe_test_publishable_key"
              value={stripeTestPubKey}
              onChange={(e) => setStripeTestPubKey(e.target.value)}
              placeholder="pk_test_xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>
          <SecretField
            id="stripe_test_webhook_secret"
            label="テスト Webhook シークレット"
            placeholder="whsec_xxxxxxxxxxxx（テスト用）"
            saved={stripeTestWebhookSaved}
            value={stripeTestWebhook}
            onChange={setStripeTestWebhook}
            show={showStripeTestWebhook}
            onToggleShow={() => setShowStripeTestWebhook((v) => !v)}
            editing={stripeTestWebhookEditing}
            onEdit={() => { setStripeTestWebhook(""); setStripeTestWebhookEditing(true) }}
          />
        </div>

        {/* 本番キー */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-ireland-green" />
            <h3 className="text-sm font-bold text-foreground">本番用キー</h3>
            <span className="text-xs bg-ireland-green/10 text-ireland-green px-2 py-0.5 rounded-full font-mono">sk_live_ / pk_live_</span>
          </div>
          <SecretField
            id="stripe_secret_key"
            label="本番 シークレットキー"
            placeholder="sk_live_xxxxxxxxxxxx"
            saved={stripeKeySaved}
            value={stripeKey}
            onChange={setStripeKey}
            show={showStripeKey}
            onToggleShow={() => setShowStripeKey((v) => !v)}
            editing={stripeKeyEditing}
            onEdit={() => { setStripeKey(""); setStripeKeyEditing(true) }}
          />
          <div className="space-y-2">
            <Label htmlFor="stripe_publishable_key">
              本番 公開キー
              {stripePubKeySaved && <span className="ml-2 text-xs text-ireland-green font-normal">設定済み</span>}
            </Label>
            <Input
              id="stripe_publishable_key"
              value={stripePubKey}
              onChange={(e) => setStripePubKey(e.target.value)}
              placeholder="pk_live_xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>
          <SecretField
            id="stripe_webhook_secret"
            label="本番 Webhook シークレット"
            placeholder="whsec_xxxxxxxxxxxx（本番用）"
            saved={stripeWebhookSaved}
            value={stripeWebhook}
            onChange={setStripeWebhook}
            show={showStripeWebhook}
            onToggleShow={() => setShowStripeWebhook((v) => !v)}
            editing={stripeWebhookEditing}
            onEdit={() => { setStripeWebhook(""); setStripeWebhookEditing(true) }}
          />
        </div>
      </div>

      {/* SMTP メール送信設定 */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">メール送信設定（SMTP）</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          返信先アドレス: <code className="font-mono bg-muted px-1 rounded">greenirelandfes@iris-corp.co.jp</code>
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="smtp_host">SMTPホスト</Label>
            <Input
              id="smtp_host"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_port">ポート</Label>
            <Input
              id="smtp_port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_user">SMTPユーザー名</Label>
          <Input
            id="smtp_user"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="user@iris-corp.co.jp"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="smtp_pass">
              SMTPパスワード
              {smtpPassSaved && <span className="ml-2 text-xs text-ireland-green font-normal">設定済み</span>}
            </Label>
            {smtpPassSaved && !smtpPassEditing && (
              <button type="button" onClick={() => { setSmtpPass(""); setSmtpPassEditing(true) }} className="text-xs text-ireland-green underline underline-offset-2">
                変更する
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              id="smtp_pass"
              type={showSmtpPass ? "text" : "password"}
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              readOnly={smtpPassSaved && !smtpPassEditing}
              placeholder="SMTPパスワード"
              className={`pr-10 font-mono text-sm ${smtpPassSaved && !smtpPassEditing ? "bg-muted cursor-default select-none" : ""}`}
            />
            <button type="button" onClick={() => setShowSmtpPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_from">送信元メールアドレス</Label>
          <Input
            id="email_from"
            type="email"
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            placeholder="greenirelandfes@iris-corp.co.jp"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            メールの From に表示されるアドレスです。SMTPサーバーで送信が許可されたアドレスを指定してください。
          </p>
        </div>
      </div>

      {/* 完了画面 QRコード・リンク */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">完了画面 QRコード・リンク</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          支援完了・購入完了の画面に表示するQRコードとリンクを設定します。LINE公式アカウントやSNSへの誘導などにご利用ください。
        </p>

        <div className="space-y-2">
          <Label htmlFor="success_qr_url">QRコード URL</Label>
          <Input
            id="success_qr_url"
            value={successQrUrl}
            onChange={(e) => setSuccessQrUrl(e.target.value)}
            placeholder="https://line.me/R/ti/p/@example"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">このURLのQRコードが完了画面に表示されます。空欄の場合は非表示。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_qr_label">QRコード ラベル</Label>
          <Input
            id="success_qr_label"
            value={successQrLabel}
            onChange={(e) => setSuccessQrLabel(e.target.value)}
            placeholder="LINE公式アカウントを友だち追加"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_link_url">リンク URL</Label>
          <Input
            id="success_link_url"
            value={successLinkUrl}
            onChange={(e) => setSuccessLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">完了画面にボタンリンクとして表示されます。空欄の場合は非表示。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_link_label">リンク ラベル</Label>
          <Input
            id="success_link_label"
            value={successLinkLabel}
            onChange={(e) => setSuccessLinkLabel(e.target.value)}
            placeholder="イベント詳細はこちら"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_redirect_seconds">自動リダイレクト秒数（オプション）</Label>
          <Input
            id="success_redirect_seconds"
            type="number"
            min={0}
            value={successRedirectSeconds}
            onChange={(e) => setSuccessRedirectSeconds(e.target.value)}
            placeholder="10"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">秒数を指定すると、完了画面から自動的にホームにリダイレクト。0 = リダイレクトなし。</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success_message">任意メッセージ</Label>
          <Textarea
            id="success_message"
            value={successMessage}
            onChange={(e) => setSuccessMessage(e.target.value)}
            placeholder="ご支援ありがとうございます。イベント当日のご来場をお待ちしております！"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">完了画面のQRコード上に表示。空欄で非表示。</p>
        </div>

        {/* プレビュー */}
        {successQrUrl && (
          <div className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs font-bold text-muted-foreground">プレビュー</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(successQrUrl)}`}
              alt="QR Preview"
              className="mx-auto rounded-lg"
              width={120}
              height={120}
            />
            {successQrLabel && <p className="text-xs text-foreground font-bold">{successQrLabel}</p>}
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="bg-ireland-green hover:bg-ireland-green/90 text-white gap-2"
      >
        {saved ? (
          <><Check className="w-4 h-4" />保存しました</>
        ) : (
          <><Save className="w-4 h-4" />{isPending ? "保存中..." : "設定を保存"}</>
        )}
      </Button>
    </div>
  )
}

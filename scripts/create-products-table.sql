-- productsテーブル作成
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  venue_key VARCHAR NOT NULL,
  venue_label VARCHAR NOT NULL,
  ticket_count INTEGER NOT NULL,
  quick_url_id VARCHAR NOT NULL,
  liff_url TEXT NOT NULL,
  miniapp_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- データ投入
INSERT INTO products (venue_key, venue_label, ticket_count, quick_url_id, liff_url, miniapp_url) VALUES
-- 米子
('yonago_524', '5/24 (日) 米子コンベンションセンター', 1, '23896', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23896', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23896'),
('yonago_524', '5/24 (日) 米子コンベンションセンター', 2, '23897', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23897', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23897'),
('yonago_524', '5/24 (日) 米子コンベンションセンター', 3, '23898', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23898', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23898'),
('yonago_524', '5/24 (日) 米子コンベンションセンター', 4, '23899', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23899', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23899'),
-- 熊本
('kumamoto_719', '7/19 (日) 熊本城ホール メインホール', 1, '23900', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23900', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23900'),
('kumamoto_719', '7/19 (日) 熊本城ホール メインホール', 2, '23901', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23901', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23901'),
('kumamoto_719', '7/19 (日) 熊本城ホール メインホール', 3, '23902', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23902', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23902'),
('kumamoto_719', '7/19 (日) 熊本城ホール メインホール', 4, '23903', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23903', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23903'),
-- 長崎
('nagasaki_801', '8/1 (土) ベネックス長崎ブリックホール', 1, '23904', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23904', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23904'),
('nagasaki_801', '8/1 (土) ベネックス長崎ブリックホール', 2, '23905', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23905', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23905'),
('nagasaki_801', '8/1 (土) ベネックス長崎ブリックホール', 3, '23906', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23906', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23906'),
('nagasaki_801', '8/1 (土) ベネックス長崎ブリックホール', 4, '23907', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23907', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23907'),
-- 大分
('oita_802', '8/2 (日) iichikoグランシアタ', 1, '23908', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23908', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23908'),
('oita_802', '8/2 (日) iichikoグランシアタ', 2, '23909', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23909', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23909'),
('oita_802', '8/2 (日) iichikoグランシアタ', 3, '23910', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23910', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23910'),
('oita_802', '8/2 (日) iichikoグランシアタ', 4, '23911', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23911', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23911'),
-- 島根
('shimane_1003', '10/3 (土) 島根県芸術文化センターグラントワ', 1, '23912', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23912', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23912'),
('shimane_1003', '10/3 (土) 島根県芸術文化センターグラントワ', 2, '23913', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23913', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23913'),
('shimane_1003', '10/3 (土) 島根県芸術文化センターグラントワ', 3, '23914', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23914', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23914'),
('shimane_1003', '10/3 (土) 島根県芸術文化センターグラントワ', 4, '23915', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23915', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23915'),
-- 松山
('matsuyama_1011', '10/11 (日) 松山市民会館・大ホール', 1, '23916', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23916', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23916'),
('matsuyama_1011', '10/11 (日) 松山市民会館・大ホール', 2, '23917', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23917', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23917'),
('matsuyama_1011', '10/11 (日) 松山市民会館・大ホール', 3, '23918', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23918', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23918'),
('matsuyama_1011', '10/11 (日) 松山市民会館・大ホール', 4, '23919', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23919', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23919'),
-- 青森
('aomori_1017', '10/17 (土) リンクステーションホール青森', 1, '23920', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23920', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23920'),
('aomori_1017', '10/17 (土) リンクステーションホール青森', 2, '23921', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23921', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23921'),
('aomori_1017', '10/17 (土) リンクステーションホール青森', 3, '23922', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23922', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23922'),
('aomori_1017', '10/17 (土) リンクステーションホール青森', 4, '23923', 'https://liff.line.me/2009064334-WVPtqdFS?page=item&itemId=23923', 'https://miniapp.line.me/2009085559-Xdjtitfp?target=ecItem&item_id=23923')
ON CONFLICT DO NOTHING;

-- 各会場カラムの空文字('')をNULLに変換する
-- '0枚' や '0' もNULLに統一する

UPDATE applicants SET yonago_524    = NULL WHERE yonago_524    IS NULL OR TRIM(yonago_524)    = '' OR yonago_524    ~ '^0';
UPDATE applicants SET kumamoto_719  = NULL WHERE kumamoto_719  IS NULL OR TRIM(kumamoto_719)  = '' OR kumamoto_719  ~ '^0';
UPDATE applicants SET nagasaki_801  = NULL WHERE nagasaki_801  IS NULL OR TRIM(nagasaki_801)  = '' OR nagasaki_801  ~ '^0';
UPDATE applicants SET oita_802      = NULL WHERE oita_802      IS NULL OR TRIM(oita_802)      = '' OR oita_802      ~ '^0';
UPDATE applicants SET shimane_1003  = NULL WHERE shimane_1003  IS NULL OR TRIM(shimane_1003)  = '' OR shimane_1003  ~ '^0';
UPDATE applicants SET matsuyama_1011 = NULL WHERE matsuyama_1011 IS NULL OR TRIM(matsuyama_1011) = '' OR matsuyama_1011 ~ '^0';
UPDATE applicants SET aomori_1017   = NULL WHERE aomori_1017   IS NULL OR TRIM(aomori_1017)   = '' OR aomori_1017   ~ '^0';

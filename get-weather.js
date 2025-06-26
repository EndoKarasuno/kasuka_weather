// netlify/functions/get-weather.js

// Node.js環境で外部APIを呼び出すためのfetchをインポート
// Netlify FunctionsはNode.jsで動作するため、'node-fetch'が必要です。
const fetch = require('node-fetch'); 

// この関数がNetlify Functionsからのリクエストを処理します。
// event: リクエストの情報（URLパラメータなど）
// context: 実行環境の情報
exports.handler = async (event, context) => {
    // APIキーはNetlifyの環境変数から取得します。
    // GitHubのリポジトリには直接書き込みません。
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    // クライアントからのURLクエリパラメータ（例: ?city=Tokyo）から都市名を取得します。
    // cityパラメータがない場合は、デフォルトで 'Tokyo' を使用します。
    const city = event.queryStringParameters.city || 'Tokyo'; 

    // 環境変数にAPIキーが設定されていない場合のエラーハンドリング
    if (!OPENWEATHER_API_KEY) {
        return {
            statusCode: 500, // サーバー内部エラー
            body: JSON.stringify({ error: 'OpenWeatherMap API Key is not set in environment variables.' }),
        };
    }

    try {
        // OpenWeatherMap APIのURLを構築します。
        // ここで安全に取得したAPIキーを使用します。
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ja`;
        
        // OpenWeatherMap APIを呼び出し
        const response = await fetch(url);

        // APIからのレスポンスが成功しなかった場合（例: 401 Unauthorized, 404 Not Foundなど）
        if (!response.ok) {
            const errorData = await response.json(); // APIからのエラー詳細を取得
            return {
                statusCode: response.status, // APIから返されたHTTPステータスコードをそのまま返す
                body: JSON.stringify({ 
                    error: errorData.message || 'Failed to fetch weather data from OpenWeatherMap API.',
                    // 必要であれば、OpenWeatherMapのエラーコードなども含める
                    // code: errorData.cod 
                }),
            };
        }

        // 成功した場合、JSONレスポンスを解析
        const data = await response.json();

        // 取得した天気データをフロントエンドに返す
        return {
            statusCode: 200, // 成功
            headers: {
                "Content-Type": "application/json", // JSON形式であることを指定
                // CORSポリシーが必要な場合（異なるドメインからの呼び出しを許可する場合）
                // "Access-Control-Allow-Origin": "*", // 特定のオリジンを指定するのが安全（例: "https://your-site.netlify.app"）
            },
            body: JSON.stringify(data), // JSON文字列としてレスポンスボディに含める
        };

    } catch (error) {
        // 関数実行中の予期せぬエラー（ネットワークエラーなど）
        console.error('Function execution error:', error);
        return {
            statusCode: 500, // サーバー内部エラー
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
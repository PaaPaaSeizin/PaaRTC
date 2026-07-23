// SkyWay SDK のモジュールを取得[reference:2]
const { SkyWayContext, SkyWayRoom, SkyWayStreamFactory, LocalVideoStream } = skyway_room;

// --- 設定 ---
// !!! ここにあなたのSkyWay APIキーを入力してください !!!
const API_KEY = '77088e00-0018-4668-9bca-4bb642769469';
const roomNameInput = document.getElementById('roomNameInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const viewRoomBtn = document.getElementById('viewRoomBtn');
const localVideo = document.getElementById('localVideo');
const errorMessage = document.getElementById('errorMessage');

// エラーメッセージを表示する関数
function showError(msg) {
    errorMessage.textContent = msg;
}

// --- 関数: ホストとして参加 (画面共有) ---
joinRoomBtn.onclick = async () => {
    const roomName = roomNameInput.value || 'my-room';
    try {
        // 1. SkyWay Context を作成
        const context = await SkyWayContext.Create(API_KEY);

        // 2. SFUタイプのルームを作成または取得[reference:3]
        //    SFUルームは多人数でのパフォーマンスに優れています[reference:4]
        const room = await SkyWayRoom.FindOrCreate(context, {
            name: roomName,
            type: 'sfu',
        });

        // 3. ルームに参加 (メンバーになる)
        const member = await room.join();

        // 4. 画面共有ストリームを取得[reference:5][reference:6]
        //    displaySurface: 'monitor' で画面全体をデフォルト選択[reference:7]
        const { video } = await SkyWayStreamFactory.createDisplayStreams({
            video: { displaySurface: 'monitor' }
        });

        // 5. 取得した画面をローカルのvideo要素に表示
        //    LocalVideoStream は HTMLVideoElement を操作するためのラッパー
        const localVideoStream = new LocalVideoStream(video);
        await localVideoStream.attach(localVideo);
        await localVideoStream.play();

        // 6. 画面ストリームをルームに公開 (Publish)[reference:8]
        await member.publish(video);

        console.log(`✅ ホストとしてルーム "${roomName}" に参加し、画面共有を開始しました。`);
    } catch (error) {
        console.error(error);
        showError(`ホスト参加エラー: ${error.message}`);
    }
};

// --- 関数: 視聴者として参加 ---
viewRoomBtn.onclick = async () => {
    const roomName = roomNameInput.value || 'my-room';
    try {
        // 1. SkyWay Context を作成
        const context = await SkyWayContext.Create(API_KEY);

        // 2. 既存のルームを取得 (見つからなければエラー)
        const room = await SkyWayRoom.FindOrCreate(context, {
            name: roomName,
            type: 'sfu',
        });

        // 3. ルームに参加
        const member = await room.join();

        // 4. ルーム内の既存のストリーム (ホストの画面共有) を購読 (Subscribe)
        //    ルームに参加した時点で、既に公開されているストリームを取得できる
        //    ここでは、他のメンバーが公開しているビデオストリームを探して購読する
        for (const publication of member.publications) {
            if (publication.stream && publication.stream.contentType === 'video') {
                // ストリームを購読する
                const subscription = await member.subscribe(publication.id);
                // 購読したストリームをローカルのvideo要素に表示
                const remoteVideoStream = new LocalVideoStream(subscription.stream);
                await remoteVideoStream.attach(localVideo);
                await remoteVideoStream.play();
                console.log(`✅ 視聴者としてルーム "${roomName}" に参加し、映像を受信しました。`);
                return; // 最初に見つけた映像でOK
            }
        }

        // もしルームに映像が見つからなかった場合
        showError('ルームに共有されている画面が見つかりませんでした。');
    } catch (error) {
        console.error(error);
        showError(`視聴者参加エラー: ${error.message}`);
    }
};

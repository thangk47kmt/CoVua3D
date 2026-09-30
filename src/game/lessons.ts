export type LessonGoal = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n" | "any";
};

export type Lesson = {
  id: string;
  title: string;
  lead: string;
  points: string[];
  fen: string;
  hint: string;
  success: string;
  goal?: LessonGoal;
  anyMove?: boolean;
  readOnly?: boolean;
};

export const LESSONS: Lesson[] = [
  {
    id: "goal",
    title: "Mục tiêu",
    lead: "Cờ vua là cuộc đấu giữa hai đội quân trên bàn 64 ô. Không cần ăn hết quân — chỉ cần bắt vua đối phương không còn đường thoát.",
    points: [
      "Bàn có 8 cột a–h và 8 hàng 1–8. Mỗi bên bắt đầu với 8 tốt, 2 xe, 2 mã, 2 tượng, 1 hậu và 1 vua.",
      "Trắng đi trước, rồi hai bên lần lượt mỗi bên một nước.",
      "Thắng khi chiếu hết: vua địch đang bị tấn công và không có nước hợp lệ nào để thoát.",
      "Vua không bao giờ bị ăn. Ván dừng ngay khi chiếu hết.",
      "Hòa nếu pat, lặp thế cờ, hết lực, luật 50 nước, hoặc hai bên đồng ý.",
    ],
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    hint: "Đọc xong thì sang bài sau.",
    success: "",
    readOnly: true,
  },
  {
    id: "controls",
    title: "Cách đi trên bàn",
    lead: "Trên bàn này, một nước đi gồm hai lần chạm: chọn quân, rồi chọn ô.",
    points: [
      "Chạm quân của phe đang tới lượt. Các ô đi được sẽ sáng lên.",
      "Chấm tròn là ô trống. Vòng tròn là ô có quân địch — chạm vào đó để bắt.",
      "Chạm quân khác cùng phe để đổi lựa chọn. Chạm ô không hợp lệ để bỏ chọn.",
      "Kéo để xoay bàn. Các nút mũi tên lia camera. + phóng sát quân đang chọn, − thu ra, ô vuông trả về toàn bàn.",
      "Hãy thử đi một nước hợp lệ bất kỳ của Trắng.",
    ],
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    hint: "Chọn một quân trắng, rồi chạm một ô đang sáng.",
    success: "Đúng rồi. Ô sáng là nước hợp lệ, ô không sáng thì quân không tới được.",
    anyMove: true,
  },
  {
    id: "pawn",
    title: "Quân tốt",
    lead: "Tốt đi chậm, chỉ tiến, nhưng là quân duy nhất bắt theo hướng khác với hướng đi.",
    points: [
      "Đi thẳng một ô về phía trước, nếu ô đó trống. Không được đi lùi.",
      "Từ hàng xuất phát được đi hai ô, nếu cả hai ô phía trước đều trống.",
      "Bắt chéo một ô về phía trước, không bao giờ bắt thẳng.",
      "Tới hàng cuối cùng thì được phong thành quân khác.",
      "Tốt trắng đang ở e4. Hãy bắt tốt đen ở d5.",
    ],
    fen: "8/8/8/3p4/4P3/8/8/4K2k w - - 0 1",
    hint: "Chạm tốt trắng, rồi chạm d5.",
    success: "Tốt bắt chéo. Nếu đi thẳng e5 thì không ăn được quân đang đứng chéo.",
    goal: { from: "e4", to: "d5" },
  },
  {
    id: "rook",
    title: "Quân xe",
    lead: "Xe đi theo hàng và cột, xa bao nhiêu cũng được, miễn đường không bị chặn.",
    points: [
      "Đi ngang hoặc dọc, không đi chéo và không nhảy qua quân.",
      "Dừng ở ô trống, hoặc dừng ngay trên quân địch để bắt. Không được dừng trên quân mình.",
      "Xe mạnh nhất khi có cột mở — cột không còn tốt của hai bên.",
      "Hãy đưa xe từ a1 lên hết cột a, tới a8.",
    ],
    fen: "8/8/8/8/8/8/8/R3K2k w - - 0 1",
    hint: "Chạm xe ở a1, rồi chạm a8.",
    success: "Xe đi suốt cột a vì không có quân nào đứng giữa.",
    goal: { from: "a1", to: "a8" },
  },
  {
    id: "knight",
    title: "Quân mã",
    lead: "Mã là quân duy nhất nhảy qua quân khác. Nước đi của mã luôn là hình chữ L.",
    points: [
      "Đi hai ô theo một hướng rồi một ô vuông góc. Hoặc một ô rồi hai ô.",
      "Có thể nhảy qua cả quân ta lẫn quân địch. Ô đích trống thì đi, có quân địch thì bắt.",
      "Mỗi nước, mã đổi màu ô: đang ở ô đen thì tới ô trắng, và ngược lại.",
      "Hãy đưa mã từ b1 tới c3.",
    ],
    fen: "8/8/8/8/8/8/8/1N2K2k w - - 0 1",
    hint: "Chạm mã ở b1, rồi chạm c3.",
    success: "Hai ô lên và một ô sang phải — đó là chữ L. Mã không cần đường trống.",
    goal: { from: "b1", to: "c3" },
  },
  {
    id: "bishop",
    title: "Quân tượng",
    lead: "Tượng chỉ đi chéo và ở mãi một màu ô suốt ván.",
    points: [
      "Đi chéo bao nhiêu ô cũng được, không nhảy qua quân.",
      "Tượng xuất phát ở ô đen thì không bao giờ tới được ô trắng. Vì vậy hai tượng của một bên trông coi hai màu khác nhau.",
      "Tượng này đang ở c1, một ô đen. g5 cũng là ô đen, cùng một đường chéo.",
      "Hãy đưa tượng tới g5.",
    ],
    fen: "8/8/8/8/8/8/8/2B1K2k w - - 0 1",
    hint: "Chạm tượng ở c1, rồi chạm g5.",
    success: "Tượng giữ đúng màu ô. Nó không bao giờ đổi sang ô trắng.",
    goal: { from: "c1", to: "g5" },
  },
  {
    id: "queen",
    title: "Quân hậu",
    lead: "Hậu đi như xe và như tượng cộng lại: ngang, dọc hoặc chéo.",
    points: [
      "Xa bao nhiêu cũng được, nhưng không nhảy qua quân.",
      "Hậu là quân mạnh nhất vì đổi hướng được cả hai kiểu. Đổi lại, mất hậu thường là mất thế.",
      "Từ d1, hậu có thể đi dọc như xe hoặc chéo như tượng.",
      "Hãy đưa hậu theo đường chéo tới h5.",
    ],
    fen: "k7/8/8/8/8/8/8/3QK3 w - - 0 1",
    hint: "Chạm hậu ở d1, rồi chạm h5.",
    success: "Một đường chéo dài. Hậu cũng có thể đi dọc tới d8 nếu muốn.",
    goal: { from: "d1", to: "h5" },
  },
  {
    id: "check",
    title: "Vua và chiếu",
    lead: "Vua đi chậm, mỗi nước chỉ một ô, nhưng không bao giờ được bước vào chỗ nguy hiểm.",
    points: [
      "Vua đi một ô theo mọi hướng: ngang, dọc hoặc chéo.",
      "Không được đi vào ô đang bị quân địch tấn công, và không được đứng cạnh vua địch.",
      "Chiếu nghĩa là vua đang bị tấn công. Phải thoát ngay trong nước đó: đưa vua đi, chặn đường chiếu, hoặc ăn quân đang chiếu.",
      "Xe đen đang chiếu vua trắng dọc hàng 1. Hãy đưa vua thoát chiếu.",
    ],
    fen: "4k3/8/8/8/8/8/8/4K2r w - - 0 1",
    hint: "Vua không được ở lại hàng 1. Hãy bước lên một ô phía trên.",
    success: "Vua đã ra khỏi hàng bị xe kiểm soát. Nếu không thoát, nước đó là nước phạm luật.",
    anyMove: true,
  },
  {
    id: "mate",
    title: "Chiếu hết",
    lead: "Chiếu hết là chiếu mà vua không đi được, không chặn được và cũng không ăn được quân đang chiếu.",
    points: [
      "Khác với chiếu thường: đối phương không còn nước hợp lệ nào.",
      "Vua không bị bắt khỏi bàn. Ván kết thúc, bên chiếu hết thắng.",
      "Thế này là đòn chiếu hết của học trò: hậu ở h5, tượng ở c4 trông xuống f7.",
      "Hãy cho hậu bắt tốt ở f7.",
    ],
    fen: "rnbqkbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 2 3",
    hint: "Chạm hậu ở h5, rồi chạm f7.",
    success: "Hậu trên f7 được tượng c4 bảo vệ. Vua đen không bắt được hậu, không chặn được và không còn ô thoát.",
    goal: { from: "h5", to: "f7" },
  },
  {
    id: "draw",
    title: "Hòa và pat",
    lead: "Không phải thế kẹt nào cũng là thắng. Nếu vua hết nước mà không bị chiếu, ván hòa — gọi là pat.",
    points: [
      "Đến lượt Đen. Vua ở a8 không bị chiếu, nhưng a7, b7 và b8 đều do hậu trắng kiểm soát. Đen không còn nước nào.",
      "Đó là pat: hòa, không phải Đen thua. Dồn vua đối phương vào góc mà quên không chiếu thì có thể làm mất ván thắng.",
      "Hòa còn xảy ra khi lặp lại cùng một thế cờ ba lần, khi 50 nước liền không có nước bắt quân hoặc đẩy tốt, khi hai bên không đủ quân để chiếu hết, hoặc khi xin hòa và được nhận.",
      "Vua với vua, vua với một mã, hoặc vua với một tượng là những thế không đủ lực chiếu hết.",
    ],
    fen: "k7/8/1QK5/8/8/8/8/8 b - - 0 1",
    hint: "Thế này đã hòa. Sang bài sau để học nhập thành.",
    success: "",
    readOnly: true,
  },
  {
    id: "castle",
    title: "Nhập thành",
    lead: "Nhập thành là nước duy nhất đi hai quân cùng lúc: vua trú vào góc, xe bước ra tham chiến.",
    points: [
      "Vua đi hai ô về phía xe. Xe nhảy qua vua và đứng ngay ô bên cạnh vua.",
      "Cánh vua, bên phải của Trắng, là nhập thành gần. Cánh hậu, bên trái, là nhập thành xa.",
      "Chỉ được nhập thành khi vua và xe đó chưa đi, các ô giữa đang trống, vua không đang bị chiếu, và vua không đi qua hay dừng ở ô bị tấn công.",
      "Mỗi bên chỉ nhập thành một lần. Hãy nhập thành cánh vua: đưa vua từ e1 tới g1.",
    ],
    fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    hint: "Chạm vua ở e1, rồi chạm g1. Xe h1 sẽ tự nhảy sang f1.",
    success: "Vua tới g1, xe tới f1. Đó là một nước, không phải hai.",
    goal: { from: "e1", to: "g1" },
  },
  {
    id: "passant",
    title: "Bắt tốt qua đường",
    lead: "Khi tốt địch vừa nhảy hai ô và dừng ngang hàng, sát tốt của bạn, bạn được bắt nó như thể nó chỉ đi một ô.",
    points: [
      "Tốt đen vừa từ d7 nhảy tới d5, ngang với tốt trắng ở e5.",
      "Trắng được bắt chéo tới d6. Tốt đen ở d5 biến mất, dù ô bạn tới là d6.",
      "Quyền này chỉ có đúng nước ngay sau đó. Đi nước khác là mất quyền bắt qua đường.",
      "Hãy bắt qua đường: tốt e5 tới d6.",
    ],
    fen: "8/8/8/3pP3/8/8/8/4K2k w - d6 0 1",
    hint: "Chạm tốt trắng ở e5, rồi chạm d6.",
    success: "Tốt đen bị bắt dù không đứng ở ô bạn tới. Đây là nước bắt duy nhất đi lệch khỏi quân bị bắt.",
    goal: { from: "e5", to: "d6" },
  },
  {
    id: "promote",
    title: "Phong cấp",
    lead: "Tốt đi tới hàng cuối không còn là tốt. Bạn phải đổi nó thành hậu, xe, tượng hoặc mã.",
    points: [
      "Trắng tới hàng 8. Đen tới hàng 1. Việc đổi quân là bắt buộc và xảy ra trong cùng nước đi.",
      "Hầu hết thời điểm nên chọn hậu, vì hậu đi được nhiều hướng nhất.",
      "Đôi khi phong mã lại mạnh hơn, nếu nước nhảy của mã chiếu ngay vua địch.",
      "Hãy đẩy tốt e7 lên e8 và phong thành hậu.",
    ],
    fen: "8/4P3/8/8/8/8/8/4K2k w - - 0 1",
    hint: "Chạm tốt ở e7, chạm e8, rồi chọn Hậu.",
    success: "Tốt đã thành hậu. Một tốt tới hàng cuối thường đổi hẳn cục diện ván.",
    goal: { from: "e7", to: "e8", promotion: "q" },
  },
];

import { ChapterLength, StoryTone } from "@/types";

const TONE_MAP: Record<StoryTone, string> = {
  humorous: "hài hước, dí dỏm, nhẹ nhàng",
  serious: "nghiêm túc, sâu lắng, kịch tính",
  dark: "u ám, đen tối, căng thẳng",
  wholesome: "ấm áp, tích cực, trong sáng",
  balanced: "cân bằng giữa hài hước và nghiêm túc",
};

const LENGTH_MAP: Record<ChapterLength, string> = {
  short: "khoảng 100 từ",
  medium: "khoảng 200 từ",
  long: "khoảng 300 từ",
};

function buildCompanionBlock(params: {
  companionName: string;
  companionRole: string;
  companionDescription: string;
  companionGoal: string;
  companionArc: string;
}): string {
  if (!params.companionName.trim()) {
    return "Chưa có đồng hành cố định. Nếu tạo đồng hành mới, phải cho họ suy nghĩ riêng, mục tiêu riêng và giữ nhất quán về sau.";
  }

  return [
    `Tên: ${params.companionName}`,
    `Vai trò: ${params.companionRole || "Người đồng hành quan trọng"}`,
    `Mô tả: ${params.companionDescription || "Có tính cách và lựa chọn riêng"}`,
    `Mục tiêu riêng: ${params.companionGoal || "Có động cơ cá nhân riêng"}`,
    `Hành trình đồng hành: ${params.companionArc || "Có thể đi cùng một chặng hoặc cả hành trình"}`,
  ].join("\n");
}

export function buildSystemPrompt(params: {
  genre: string;
  tone: StoryTone;
  chapterLength: ChapterLength;
  worldSetting: string;
  cultivationSystem: string;
  endingGoal: string;
  characterName: string;
  characterDescription: string;
  companionName: string;
  companionRole: string;
  companionDescription: string;
  companionGoal: string;
  companionArc: string;
}): string {
  return `Bạn là một nhà văn ${params.genre} tài năng người Việt Nam. Nhiệm vụ của bạn là viết truyện tương tác theo thể loại ${params.genre}.

## CANON CỐ ĐỊNH CỦA TRUYỆN:
- Bối cảnh thế giới phải luôn được giữ đúng: ${params.worldSetting}
- Hệ thống cảnh giới/cấp bậc bắt buộc phải tuân theo: ${params.cultivationSystem}
- Đích đến và kết thúc lớn của truyện là: ${params.endingGoal}
- Hồ sơ đồng hành chính:\n${buildCompanionBlock({
    companionName: params.companionName,
    companionRole: params.companionRole,
    companionDescription: params.companionDescription,
    companionGoal: params.companionGoal,
    companionArc: params.companionArc,
  })}

## HỆ THỐNG THẾ GIỚI VÀ SỨC MẠNH:
- Chapter 1 phải xác lập rõ bối cảnh thế giới, luật vận hành, phe phái hoặc trật tự xã hội cốt lõi
- Cảnh giới phải có lộ trình rõ ràng từ thấp đến cao, không được nhảy cấp vô lý
- Nhân vật chính bắt đầu ở tầng thấp nhất hoặc rất thấp, phát triển dần qua từng chapter
- Khi nhân vật hoàn thành mục tiêu kết thúc hoặc đạt cảnh giới cao nhất hợp lệ của hệ thống → KẾT THÚC TRUYỆN với ending tương xứng

## QUY TẮC SINH TỬ:
- MỘT SỐ LỰA CHỌN CÓ THỂ DẪN ĐẾN CÁI CHẾT của nhân vật chính
- Nếu nhân vật chết → Truyện kết thúc với BAD ENDING, đặt "is_dead": true và "choices": []
- Lựa chọn liều lĩnh, thiếu suy nghĩ, hoặc đối đầu kẻ mạnh hơn nhiều có nguy cơ tử vong cao
- Hãy cảnh báo ngầm (không quá lộ liễu) về mức độ nguy hiểm qua miêu tả tình huống

## QUY TẮC VIẾT:
1. Viết bằng tiếng Việt, văn phong ${TONE_MAP[params.tone]}, độ dài ${LENGTH_MAP[params.chapterLength]}
2. Nhân vật chính tên "${params.characterName}": ${params.characterDescription}
3. Giữ nhất quán canon đã khóa ở trên trong mọi chapter, không tự ý đổi luật thế giới, đổi trần cảnh giới, đổi mục tiêu cuối hoặc phá vỡ hồ sơ đồng hành
4. Đồng hành phải có suy nghĩ, cảm xúc, ưu tiên và quyết định riêng; họ có thể ủng hộ, phản biện, tách đoàn hoặc quay lại tùy đúng với companion_arc
5. Kết thúc mỗi chapter ở điểm hồi hộp (cliffhanger) khiến người đọc muốn đọc tiếp
6. Đưa ra đúng 3 lựa chọn cho người chơi, mỗi lựa chọn DẪN CÂU CHUYỆN THEO HƯỚNG KHÁC NHAU RÕ RỆT
7. Các lựa chọn phải hợp lý với bối cảnh, có lựa chọn an toàn và lựa chọn mạo hiểm
8. Viết sinh động, miêu tả chi tiết cảnh vật, cảm xúc nhân vật

## QUY TẮC JSON BẮT BUỘC:
- Chỉ trả về MỘT object JSON duy nhất, bắt đầu bằng { và kết thúc bằng }
- Field "content" phải là MỘT chuỗi string duy nhất chứa toàn bộ nội dung chapter
- Nếu cần xuống dòng trong "content", dùng ký tự \n bên trong cùng một string
- KHÔNG được tách nội dung chapter thành nhiều chuỗi liên tiếp như: "content": "...", "...", "..."
- KHÔNG được thêm khóa lạ, chú thích, markdown, code fence, hoặc văn bản giải thích bên ngoài JSON
- Mọi hội thoại, miêu tả, độc thoại đều phải nằm bên trong string của field "content"

## ĐỊNH DẠNG TRẢ VỀ (JSON):
{
  "chapter_title": "Tên chapter ngắn gọn hấp dẫn",
  "content": "Nội dung chapter đầy đủ...\nĐoạn tiếp theo...\nLời thoại vẫn nằm trong cùng string này.",
  "choices": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"],
  "summary": "Tóm tắt 1-2 câu nội dung chính của chapter",
  "is_dead": false,
  "is_ending": false,
  "power_level": "Cấp độ hiện tại của nhân vật (ví dụ: Luyện Khí tầng 3)"
}

Ví dụ SAI:
{
  "chapter_title": "...",
  "content": "Đoạn 1",
  "Đoạn 2",
  "Đoạn 3"
}

Ví dụ ĐÚNG:
{
  "chapter_title": "...",
  "content": "Đoạn 1\n\nĐoạn 2\n\nĐoạn 3",
  "choices": ["...", "...", "..."],
  "summary": "...",
  "is_dead": false,
  "is_ending": false,
  "power_level": "..."
}

- Nếu nhân vật CHẾT: "is_dead": true, "choices": [], "is_ending": true
- Nếu đạt ĐỈNH CAO và kết thúc đẹp: "is_ending": true, "choices": []

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC.`;
}

export function buildFirstChapterPrompt(params: {
  title: string;
  premise: string;
  worldSetting: string;
  cultivationSystem: string;
  endingGoal: string;
  companionName: string;
}): string {
  return `Viết CHAPTER 1 mở đầu câu chuyện.

Tiêu đề truyện: "${params.title}"
Bối cảnh/cốt truyện: ${params.premise}
Canon thế giới cần cài vào từ đầu: ${params.worldSetting}
Hệ thống cảnh giới phải được giới thiệu hoặc gợi mở rõ ràng: ${params.cultivationSystem}
Đích đến cuối cùng của câu chuyện: ${params.endingGoal}
Đồng hành cần được giới thiệu hoặc cài mầm xuất hiện sớm: ${params.companionName}

Hãy giới thiệu nhân vật chính, bối cảnh thế giới, luật vận hành sức mạnh, và tạo ra tình huống mở đầu hấp dẫn. Kết thúc chapter ở điểm khiến người đọc tò mò muốn tiếp tục.`;
}

export function buildNextChapterPrompt(params: {
  chapterNumber: number;
  choiceMade: string;
  previousSummaries: string[];
  worldSetting: string;
  cultivationSystem: string;
  endingGoal: string;
  companionName: string;
  companionRole: string;
  companionDescription: string;
  companionGoal: string;
  companionArc: string;
  currentPowerLevel: string;
}): string {
  const contextSummary = params.previousSummaries
    .map((s, i) => `Chapter ${i + 1}: ${s}`)
    .join("\n");

  return `Viết CHAPTER ${params.chapterNumber} tiếp theo.

CANON KHÔNG ĐƯỢC PHÁ VỠ:
- Bối cảnh thế giới: ${params.worldSetting}
- Hệ thống cảnh giới: ${params.cultivationSystem}
- Mục tiêu kết thúc: ${params.endingGoal}
- Cấp độ hiện tại gần nhất của nhân vật chính: ${params.currentPowerLevel}
- Đồng hành chính:\n${buildCompanionBlock({
    companionName: params.companionName,
    companionRole: params.companionRole,
    companionDescription: params.companionDescription,
    companionGoal: params.companionGoal,
    companionArc: params.companionArc,
  })}

TÓM TẮT CÁC CHAPTER TRƯỚC:
${contextSummary}

NGƯỜI CHƠI ĐÃ CHỌN: "${params.choiceMade}"

Hãy tiếp tục câu chuyện dựa trên lựa chọn của người chơi. Phát triển cốt truyện theo hướng phù hợp với lựa chọn đó, đồng thời giữ nguyên canon thế giới, tiến trình cảnh giới hợp lý, và cho đồng hành phản ứng như một con người có ý chí riêng.`;
}

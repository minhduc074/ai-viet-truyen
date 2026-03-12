import { ChapterLength, StoryTone } from "@/types";

const TONE_MAP: Record<StoryTone, string> = {
  humorous: "hài hước, dí dỏm, nhẹ nhàng",
  serious: "nghiêm túc, sâu lắng, kịch tính",
  dark: "u ám, đen tối, căng thẳng",
  wholesome: "ấm áp, tích cực, trong sáng",
  balanced: "cân bằng giữa hài hước và nghiêm túc",
};

const LENGTH_MAP: Record<ChapterLength, string> = {
  short: "khoảng 300 từ",
  medium: "khoảng 600 từ",
  long: "khoảng 1000 từ",
};

export function buildSystemPrompt(params: {
  genre: string;
  tone: StoryTone;
  chapterLength: ChapterLength;
  characterName: string;
  characterDescription: string;
}): string {
  return `Bạn là một nhà văn ${params.genre} tài năng người Việt Nam. Nhiệm vụ của bạn là viết truyện tương tác theo thể loại ${params.genre}.

## HỆ THỐNG THẾ GIỚI VÀ SỨC MẠNH:
- Ngay từ chapter 1, hãy thiết lập rõ ràng bối cảnh thế giới (địa lý, lịch sử, xã hội)
- Xây dựng hệ thống sức mạnh/cấp bậc cụ thể (ví dụ: Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần, hoặc tương tự phù hợp với thể loại)
- Nhân vật chính bắt đầu ở cấp thấp nhất và phát triển dần qua các chapter
- Khi nhân vật đạt đỉnh cao sức mạnh tối đa của hệ thống → KẾT THÚC TRUYỆN với ending hoành tráng

## QUY TẮC SINH TỬ:
- MỘT SỐ LỰA CHỌN CÓ THỂ DẪN ĐẾN CÁI CHẾT của nhân vật chính
- Nếu nhân vật chết → Truyện kết thúc với BAD ENDING, đặt "is_dead": true và "choices": []
- Lựa chọn liều lĩnh, thiếu suy nghĩ, hoặc đối đầu kẻ mạnh hơn nhiều có nguy cơ tử vong cao
- Hãy cảnh báo ngầm (không quá lộ liễu) về mức độ nguy hiểm qua miêu tả tình huống

## QUY TẮC VIẾT:
1. Viết bằng tiếng Việt, văn phong ${TONE_MAP[params.tone]}, độ dài ${LENGTH_MAP[params.chapterLength]}
2. Nhân vật chính tên "${params.characterName}": ${params.characterDescription}
3. Giữ nhất quán tính cách, ngoại hình và sức mạnh của nhân vật chính xuyên suốt câu chuyện
4. Kết thúc mỗi chapter ở điểm hồi hộp (cliffhanger) khiến người đọc muốn đọc tiếp
5. Đưa ra đúng 3 lựa chọn cho người chơi, mỗi lựa chọn DẪN CÂU CHUYỆN THEO HƯỚNG KHÁC NHAU RÕ RỆT
6. Các lựa chọn phải hợp lý với bối cảnh, có lựa chọn an toàn và lựa chọn mạo hiểm
7. Viết sinh động, miêu tả chi tiết cảnh vật, cảm xúc nhân vật

## ĐỊNH DẠNG TRẢ VỀ (JSON):
{
  "chapter_title": "Tên chapter ngắn gọn hấp dẫn",
  "content": "Nội dung chapter đầy đủ...",
  "choices": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"],
  "summary": "Tóm tắt 1-2 câu nội dung chính của chapter",
  "is_dead": false,
  "is_ending": false,
  "power_level": "Cấp độ hiện tại của nhân vật (ví dụ: Luyện Khí tầng 3)"
}

- Nếu nhân vật CHẾT: "is_dead": true, "choices": [], "is_ending": true
- Nếu đạt ĐỈNH CAO và kết thúc đẹp: "is_ending": true, "choices": []

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC.`;
}

export function buildFirstChapterPrompt(params: {
  title: string;
  premise: string;
}): string {
  return `Viết CHAPTER 1 mở đầu câu chuyện.

Tiêu đề truyện: "${params.title}"
Bối cảnh/cốt truyện: ${params.premise}

Hãy giới thiệu nhân vật chính, bối cảnh thế giới, và tạo ra tình huống mở đầu hấp dẫn. Kết thúc chapter ở điểm khiến người đọc tò mò muốn tiếp tục.`;
}

export function buildNextChapterPrompt(params: {
  chapterNumber: number;
  choiceMade: string;
  previousSummaries: string[];
}): string {
  const contextSummary = params.previousSummaries
    .map((s, i) => `Chapter ${i + 1}: ${s}`)
    .join("\n");

  return `Viết CHAPTER ${params.chapterNumber} tiếp theo.

TÓM TẮT CÁC CHAPTER TRƯỚC:
${contextSummary}

NGƯỜI CHƠI ĐÃ CHỌN: "${params.choiceMade}"

Hãy tiếp tục câu chuyện dựa trên lựa chọn của người chơi. Phát triển cốt truyện theo hướng phù hợp với lựa chọn đó.`;
}

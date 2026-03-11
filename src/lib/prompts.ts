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

QUY TẮC BẮT BUỘC:
1. Viết bằng tiếng Việt, văn phong ${TONE_MAP[params.tone]}, độ dài ${LENGTH_MAP[params.chapterLength]}
2. Nhân vật chính tên "${params.characterName}": ${params.characterDescription}
3. Giữ nhất quán tính cách, ngoại hình và sức mạnh của nhân vật chính xuyên suốt câu chuyện
4. Kết thúc mỗi chapter ở điểm hồi hộp (cliffhanger) khiến người đọc muốn đọc tiếp
5. Đưa ra đúng 3 lựa chọn cho người chơi, mỗi lựa chọn DẪN CÂU CHUYỆN THEO HƯỚNG KHÁC NHAU RÕ RỆT
6. Các lựa chọn phải hợp lý với bối cảnh, không quá phi lý
7. Nội dung phải phù hợp cho mọi độ tuổi, không chứa bạo lực quá mức, nội dung người lớn hay ngôn từ thô tục
8. Viết sinh động, miêu tả chi tiết cảnh vật, cảm xúc nhân vật

ĐỊNH DẠNG TRẢ VỀ (JSON):
{
  "chapter_title": "Tên chapter ngắn gọn hấp dẫn",
  "content": "Nội dung chapter đầy đủ...",
  "choices": ["Lựa chọn 1 (mô tả hành động)", "Lựa chọn 2 (mô tả hành động)", "Lựa chọn 3 (mô tả hành động)"],
  "summary": "Tóm tắt 1-2 câu nội dung chính của chapter"
}

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

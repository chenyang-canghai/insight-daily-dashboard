import { fireEvent, render, screen } from "@testing-library/react";
import { deleteDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { ExamPractice } from "@/components/exam-practice";
import { latestDigest } from "@/lib/data";
import { resetDBForTests } from "@/lib/db";

describe("ExamPractice", () => {
  beforeEach(async () => {
    await resetDBForTests();
    await deleteDB("insight-daily-dashboard");
    await resetDBForTests();
  });

  it("keeps the answer hidden until submission", async () => {
    const question = latestDigest.exam.questions[0];
    if (!question) throw new Error("latest digest must include a question");
    render(<ExamPractice questions={[question]} />);
    expect(screen.queryByText("正确答案")).not.toBeInTheDocument();
    const answerIndex = Object.keys(question.options).indexOf(
      question.correct_answer,
    );
    fireEvent.click(screen.getAllByRole("radio")[answerIndex]!);
    fireEvent.click(screen.getByRole("button", { name: "提交并查看解析" }));
    expect(await screen.findByText("回答正确，继续保持。")).toBeInTheDocument();
    expect(screen.getByText("正确答案")).toBeInTheDocument();
  });
});
